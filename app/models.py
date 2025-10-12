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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联密码条目
    passwords = db.relationship('Password', backref='owner', lazy='dynamic', cascade='all, delete-orphan')
    
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
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Password(db.Model):
    __tablename__ = 'passwords'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(128), nullable=False)
    url = db.Column(db.String(256))
    username = db.Column(db.String(128))
    password_encrypted = db.Column(db.Text, nullable=False)  # 加密后的密码
    category = db.Column(db.String(64))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 外键关联
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def __init__(self, title, url, username, encrypted_password, category, notes, user_id):
        self.title = title
        self.url = url
        self.username = username
        self.password_encrypted = encrypted_password
        self.category = category
        self.notes = notes
        self.user_id = user_id
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'url': self.url,
            'username': self.username,
            'category': self.category,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }