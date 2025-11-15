from datetime import datetime
from app import db
import hashlib
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    salt = db.Column(db.String(64), nullable=False)
    two_factor_secret = db.Column(db.String(128))  # 2FA密钥
    two_factor_enabled = db.Column(db.Boolean, default=False)  # 是否启用2FA
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联密码条目
    passwords = db.relationship('Password', backref='owner', lazy='dynamic', cascade='all, delete-orphan')
    # 关联命令条目
    commands = db.relationship('Command', backref='owner', lazy='dynamic', cascade='all, delete-orphan')
    
    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.salt = os.urandom(16).hex()
        self.set_password(password)
    
    def set_password(self, password):
        """设置密码哈希"""
        self.password_hash = generate_password_hash(password + self.salt)
    
    def check_password(self, password):
        """验证密码"""
        return check_password_hash(self.password_hash, password + self.salt)
    
    def generate_master_key(self, password):
        """从用户密码派生主密钥"""
        # 使用PBKDF2派生密钥
        key = hashlib.pbkdf2_hmac(
            'sha256', 
            password.encode(), 
            self.salt.encode(), 
            100000  # 迭代次数
        ).hex()
        return key
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'two_factor_enabled': self.two_factor_enabled,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Password(db.Model):
    __tablename__ = 'passwords'

    id = db.Column(db.Integer, primary_key=True)
    encrypted_data = db.Column(db.Text, nullable=False)  # 加密的JSON数据（包含title, url, username, password, notes）
    category = db.Column(db.String(64))  # 明文分类，用于筛选
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 外键关联
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __init__(self, encrypted_data, category, user_id):
        self.encrypted_data = encrypted_data
        self.category = category
        self.user_id = user_id

    def to_dict(self, decrypted_data=None):
        """
        返回字典形式的密码条目
        如果提供了解密数据，则包含解密后的字段
        """
        base_dict = {
            'id': self.id,
            'category': self.category,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

        # 如果提供了解密数据，合并进去
        if decrypted_data:
            base_dict.update(decrypted_data)

        return base_dict

class Command(db.Model):
    __tablename__ = 'commands'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)  # 命令名称
    command_type = db.Column(db.String(64))  # 命令类型（如：bash, docker, git等）
    command_text = db.Column(db.Text, nullable=False)  # 命令文本
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 外键关联
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __init__(self, name, command_type, command_text, user_id):
        self.name = name
        self.command_type = command_type
        self.command_text = command_text
        self.user_id = user_id

    def to_dict(self):
        """返回字典形式的命令条目"""
        return {
            'id': self.id,
            'name': self.name,
            'command_type': self.command_type,
            'command_text': self.command_text,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }