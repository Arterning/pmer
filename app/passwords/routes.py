from flask import request, jsonify
from app import db
from app.models import Password
from app.passwords import passwords_bp
from app.auth.routes import token_required
import json
from cryptography.fernet import Fernet
import base64

def get_encryption_key(master_key):
    """从主密钥生成Fernet加密密钥"""
    # Fernet需要32位URL安全的base64编码密钥
    try:
        # 尝试将主密钥作为十六进制字符串处理
        key_bytes = bytes.fromhex(master_key)
    except ValueError:
        # 如果不是有效的十六进制字符串，直接使用UTF-8编码
        import hashlib
        # 使用SHA-256生成固定长度的字节
        key_bytes = hashlib.sha256(master_key.encode('utf-8')).digest()
    
    # 确保长度为32字节
    key_bytes = key_bytes[:32].ljust(32, b'\0')
    key = base64.urlsafe_b64encode(key_bytes)
    return key

def encrypt_password(plain_password, master_key):
    """使用主密钥加密密码"""
    key = get_encryption_key(master_key)
    f = Fernet(key)
    encrypted = f.encrypt(plain_password.encode())
    return encrypted.decode()

def decrypt_password(encrypted_password, master_key):
    """使用主密钥解密密码"""
    key = get_encryption_key(master_key)
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_password.encode())
    return decrypted.decode()

@passwords_bp.route('/', methods=['GET'])
@token_required
def get_all_passwords(current_user, master_key):
    """获取用户的所有密码条目"""
    passwords = Password.query.filter_by(user_id=current_user.id).all()
    return jsonify({
        'passwords': [password.to_dict() for password in passwords]
    }), 200

@passwords_bp.route('/<int:password_id>', methods=['GET'])
@token_required
def get_password(current_user, master_key, password_id):
    """获取特定密码条目"""
    password = Password.query.filter_by(id=password_id, user_id=current_user.id).first()

    if not password:
        return jsonify({'message': '密码条目不存在'}), 404

    # 使用从JWT中获取的master_key来解密密码
    if not master_key:
        return jsonify({'message': '缺少主密钥，请重新登录'}), 400

    try:
        decrypted_password = decrypt_password(password.password_encrypted, master_key)
        password_data = password.to_dict()
        password_data['password'] = decrypted_password
        return jsonify(password_data), 200
    except Exception as e:
        return jsonify({'message': '解密失败，主密钥可能不正确'}), 400

@passwords_bp.route('/', methods=['POST'])
@token_required
def create_password(current_user, master_key):
    """创建新的密码条目"""
    data = request.get_json()

    # 验证必要字段
    if not all(k in data for k in ('title', 'password')):
        return jsonify({'message': '缺少必要字段'}), 400

    # 使用从JWT中获取的master_key来加密密码
    if not master_key:
        return jsonify({'message': '缺少主密钥，请重新登录'}), 400

    try:
        # 加密密码
        encrypted_password = encrypt_password(data['password'], master_key)

        # 创建新密码条目
        new_password = Password(
            title=data['title'],
            url=data.get('url', ''),
            username=data.get('username', ''),
            encrypted_password=encrypted_password,
            category=data.get('category', ''),
            notes=data.get('notes', ''),
            user_id=current_user.id
        )

        db.session.add(new_password)
        db.session.commit()

        return jsonify({
            'message': '密码条目创建成功',
            'password': new_password.to_dict()
        }), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'创建失败: {str(e)}'}), 400

@passwords_bp.route('/<int:password_id>', methods=['PUT'])
@token_required
def update_password(current_user, master_key, password_id):
    """更新密码条目"""
    password = Password.query.filter_by(id=password_id, user_id=current_user.id).first()

    if not password:
        return jsonify({'message': '密码条目不存在'}), 404

    data = request.get_json()

    # 如果更新密码字段，需要主密钥
    if 'password' in data:
        if not master_key:
            return jsonify({'message': '缺少主密钥，请重新登录'}), 400

        try:
            encrypted_password = encrypt_password(data['password'], master_key)
            password.password_encrypted = encrypted_password
        except Exception as e:
            return jsonify({'message': '加密失败，主密钥可能不正确'}), 400

    # 更新其他字段
    if 'title' in data:
        password.title = data['title']
    if 'url' in data:
        password.url = data['url']
    if 'username' in data:
        password.username = data['username']
    if 'category' in data:
        password.category = data['category']
    if 'notes' in data:
        password.notes = data['notes']

    db.session.commit()

    return jsonify({
        'message': '密码条目更新成功',
        'password': password.to_dict()
    }), 200

@passwords_bp.route('/<int:password_id>', methods=['DELETE'])
@token_required
def delete_password(current_user, master_key, password_id):
    """删除密码条目"""
    password = Password.query.filter_by(id=password_id, user_id=current_user.id).first()

    if not password:
        return jsonify({'message': '密码条目不存在'}), 404

    db.session.delete(password)
    db.session.commit()

    return jsonify({'message': '密码条目删除成功'}), 200

@passwords_bp.route('/categories', methods=['GET'])
@token_required
def get_categories(current_user, master_key):
    """获取用户的所有密码分类"""
    categories = db.session.query(Password.category).filter_by(user_id=current_user.id).distinct().all()
    return jsonify({
        'categories': [category[0] for category in categories if category[0]]
    }), 200