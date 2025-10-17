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

def encrypt_password_data(data_dict, master_key):
    """
    使用主密钥加密密码数据（JSON序列化）
    data_dict 包含: title, url, username, password, notes
    """
    key = get_encryption_key(master_key)
    f = Fernet(key)
    json_str = json.dumps(data_dict, ensure_ascii=False)
    encrypted = f.encrypt(json_str.encode('utf-8'))
    return encrypted.decode()

def decrypt_password_data(encrypted_data, master_key):
    """
    使用主密钥解密密码数据
    返回包含 title, url, username, password, notes 的字典
    """
    key = get_encryption_key(master_key)
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_data.encode())
    json_str = decrypted.decode('utf-8')
    return json.loads(json_str)

@passwords_bp.route('/', methods=['GET'])
@token_required
def get_all_passwords(current_user, master_key):
    """获取用户的所有密码条目（解密后返回）"""
    passwords = Password.query.filter_by(user_id=current_user.id).all()

    if not master_key:
        return jsonify({'message': '缺少主密钥，请重新登录'}), 400

    # 解密所有密码条目
    decrypted_passwords = []
    for pwd in passwords:
        try:
            decrypted_data = decrypt_password_data(pwd.encrypted_data, master_key)
            decrypted_passwords.append(pwd.to_dict(decrypted_data))
        except Exception as e:
            print(f"Error decrypting password {pwd.id}: {e}")
            # 如果解密失败，跳过该条目或返回错误
            continue

    return jsonify({
        'passwords': decrypted_passwords
    }), 200

@passwords_bp.route('/<int:password_id>', methods=['GET'])
@token_required
def get_password(current_user, master_key, password_id):
    """获取特定密码条目（解密后返回）"""
    password = Password.query.filter_by(id=password_id, user_id=current_user.id).first()

    if not password:
        return jsonify({'message': '密码条目不存在'}), 404

    if not master_key:
        return jsonify({'message': '缺少主密钥，请重新登录'}), 400

    try:
        decrypted_data = decrypt_password_data(password.encrypted_data, master_key)
        return jsonify(password.to_dict(decrypted_data)), 200
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

    if not master_key:
        return jsonify({'message': '缺少主密钥，请重新登录'}), 400

    try:
        # 准备要加密的数据
        sensitive_data = {
            'title': data['title'],
            'url': data.get('url', ''),
            'username': data.get('username', ''),
            'password': data['password'],
            'notes': data.get('notes', '')
        }

        # 加密敏感数据
        encrypted_data = encrypt_password_data(sensitive_data, master_key)

        # 创建新密码条目
        new_password = Password(
            encrypted_data=encrypted_data,
            category=data.get('category', ''),
            user_id=current_user.id
        )

        db.session.add(new_password)
        db.session.commit()

        # 返回时包含解密后的数据
        return jsonify({
            'message': '密码条目创建成功',
            'password': new_password.to_dict(sensitive_data)
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

    if not master_key:
        return jsonify({'message': '缺少主密钥，请重新登录'}), 400

    data = request.get_json()

    try:
        # 先解密现有数据
        decrypted_data = decrypt_password_data(password.encrypted_data, master_key)

        # 更新敏感字段
        if 'title' in data:
            decrypted_data['title'] = data['title']
        if 'url' in data:
            decrypted_data['url'] = data['url']
        if 'username' in data:
            decrypted_data['username'] = data['username']
        if 'password' in data:
            decrypted_data['password'] = data['password']
        if 'notes' in data:
            decrypted_data['notes'] = data['notes']

        # 重新加密
        password.encrypted_data = encrypt_password_data(decrypted_data, master_key)

        # 更新分类（明文字段）
        if 'category' in data:
            password.category = data['category']

        db.session.commit()

        return jsonify({
            'message': '密码条目更新成功',
            'password': password.to_dict(decrypted_data)
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'更新失败: {str(e)}'}), 400

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