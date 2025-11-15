from flask import request, jsonify, current_app
from app import db
from app.models import User
from app.auth import auth_bp
import jwt
import os
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta
from functools import wraps

# 认证装饰器
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]

        if not token:
            return jsonify({'message': '缺少认证令牌'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': '无效的用户'}), 401

            # 从JWT中提取master_key（如果存在）
            master_key = data.get('master_key')
        except:
            return jsonify({'message': '无效的令牌'}), 401

        # 将master_key作为参数传递给被装饰的函数
        return f(current_user, master_key, *args, **kwargs)

    return decorated

# 支持临时token的装饰器（用于2FA设置）
def token_or_temp_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]

        if not token:
            return jsonify({'message': '缺少认证令牌'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': '无效的用户'}), 401

            # 临时token不包含master_key
            master_key = data.get('master_key')
        except:
            return jsonify({'message': '无效的令牌'}), 401

        return f(current_user, master_key, *args, **kwargs)

    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    # 检查是否允许注册
    allow_registration = os.getenv('ALLOW_REGISTRATION', 'false').lower() == 'true'
    if not allow_registration:
        return jsonify({'message': '当前暂不开放注册'}), 403

    data = request.get_json()

    # 验证必要字段
    if not all(k in data for k in ('username', 'email', 'password')):
        return jsonify({'message': '缺少必要字段'}), 400

    # 检查用户名和邮箱是否已存在
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': '用户名已存在'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': '邮箱已存在'}), 400

    # 创建新用户
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=data['password']
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': '注册成功', 'user': new_user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    # 验证必要字段
    if not all(k in data for k in ('username', 'password')):
        return jsonify({'message': '缺少必要字段'}), 400

    # 查找用户
    user = User.query.filter_by(username=data['username']).first()

    # 验证用户和密码
    if not user or not user.check_password(data['password']):
        return jsonify({'message': '用户名或密码错误'}), 401

    # 检查是否需要设置2FA（强制要求）
    if not user.two_factor_enabled:
        # 用户还没有启用2FA，返回临时token要求设置
        temp_token = jwt.encode({
            'user_id': user.id,
            'purpose': '2fa_setup_required',
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': '需要设置2FA',
            'requires_2fa_setup': True,
            'temp_token': temp_token
        }), 200

    # 检查是否启用了2FA
    if user.two_factor_enabled:
        # 如果启用了2FA，返回临时token，要求输入2FA代码
        temp_token = jwt.encode({
            'user_id': user.id,
            'password': data['password'],  # 临时存储密码用于生成master_key
            'purpose': '2fa_pending',
            'exp': datetime.utcnow() + timedelta(minutes=5)  # 5分钟有效期
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': '需要2FA验证',
            'requires_2fa': True,
            'temp_token': temp_token
        }), 200

    # 如果未启用2FA，直接返回token
    # 生成主密钥并加密存入JWT
    master_key = user.generate_master_key(data['password'])

    # 生成JWT令牌，包含加密的master_key
    token = jwt.encode({
        'user_id': user.id,
        'master_key': master_key,  # 将master_key加密存储在JWT中
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'message': '登录成功',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user, master_key):
    return jsonify({'user': current_user.to_dict()}), 200

@auth_bp.route('/change-password', methods=['PUT'])
@token_required
def change_password(current_user, master_key):
    data = request.get_json()

    # 验证必要字段
    if not all(k in data for k in ('old_password', 'new_password')):
        return jsonify({'message': '缺少必要字段'}), 400

    # 验证旧密码
    if not current_user.check_password(data['old_password']):
        return jsonify({'message': '旧密码错误'}), 401

    # 更新密码
    current_user.set_password(data['new_password'])
    db.session.commit()

    return jsonify({'message': '密码修改成功'}), 200

@auth_bp.route('/setup-2fa', methods=['POST'])
@token_or_temp_required
def setup_2fa(current_user, master_key):
    """生成2FA密钥和二维码"""
    # 生成新的2FA密钥
    secret = pyotp.random_base32()

    # 生成二维码 URI
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.username,
        issuer_name='PMER Password Manager'
    )

    # 生成二维码图片
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # 将图片转换为base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

    # 临时存储密钥（还未启用）
    current_user.two_factor_secret = secret
    db.session.commit()

    return jsonify({
        'message': '2FA密钥生成成功',
        'secret': secret,
        'qr_code': f'data:image/png;base64,{qr_code_base64}',
        'uri': totp_uri
    }), 200

@auth_bp.route('/enable-2fa', methods=['POST'])
@token_or_temp_required
def enable_2fa(current_user, master_key):
    """验证并启用2FA"""
    data = request.get_json()

    if 'code' not in data:
        return jsonify({'message': '缺少验证码'}), 400

    if not current_user.two_factor_secret:
        return jsonify({'message': '请先设置2FA'}), 400

    # 验证用户提供的代码
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(data['code'], valid_window=1):
        return jsonify({'message': '验证码错误'}), 401

    # 启用2FA
    current_user.two_factor_enabled = True
    db.session.commit()

    # 如果有密码（从请求中获取），生成正式token自动登录
    password = data.get('password')
    if password:
        # 生成主密钥
        master_key = current_user.generate_master_key(password)

        # 生成正式的JWT令牌
        token = jwt.encode({
            'user_id': current_user.id,
            'master_key': master_key,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': '2FA启用成功',
            'token': token,
            'user': current_user.to_dict(),
            'auto_login': True
        }), 200

    return jsonify({'message': '2FA启用成功'}), 200

@auth_bp.route('/disable-2fa', methods=['POST'])
@token_required
def disable_2fa(current_user, master_key):
    """禁用2FA"""
    data = request.get_json()

    if 'code' not in data:
        return jsonify({'message': '缺少验证码'}), 400

    if not current_user.two_factor_enabled:
        return jsonify({'message': '2FA未启用'}), 400

    # 验证用户提供的代码
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(data['code'], valid_window=1):
        return jsonify({'message': '验证码错误'}), 401

    # 禁用2FA
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    db.session.commit()

    return jsonify({'message': '2FA已禁用'}), 200

@auth_bp.route('/verify-2fa', methods=['POST'])
def verify_2fa():
    """登录时验证2FA代码"""
    data = request.get_json()

    if not all(k in data for k in ('temp_token', 'code')):
        return jsonify({'message': '缺少必要字段'}), 400

    try:
        # 验证临时token
        token_data = jwt.decode(data['temp_token'], current_app.config['SECRET_KEY'], algorithms=['HS256'])

        if token_data.get('purpose') != '2fa_pending':
            return jsonify({'message': '无效的临时令牌'}), 401

        user = User.query.get(token_data['user_id'])
        if not user:
            return jsonify({'message': '用户不存在'}), 401

        # 验证2FA代码
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(data['code'], valid_window=1):
            return jsonify({'message': '验证码错误'}), 401

        # 生成主密钥
        master_key = user.generate_master_key(token_data['password'])

        # 生成正式的JWT令牌
        token = jwt.encode({
            'user_id': user.id,
            'master_key': master_key,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': '登录成功',
            'token': token,
            'user': user.to_dict()
        }), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'message': '临时令牌已过期，请重新登录'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '无效的临时令牌'}), 401