from flask import request, jsonify, current_app
from app import db
from app.models import User
from app.auth import auth_bp
import jwt
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
        except:
            return jsonify({'message': '无效的令牌'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
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
    
    # 生成主密钥（不返回给客户端，仅用于加密会话）
    master_key = user.generate_master_key(data['password'])
    
    # 生成JWT令牌
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': '登录成功',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({'user': current_user.to_dict()}), 200

@auth_bp.route('/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
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