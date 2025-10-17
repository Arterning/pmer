from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 初始化数据库
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # 配置数据库
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///pmer.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # 初始化扩展
    db.init_app(app)
    CORS(app)
    
    # 注册蓝图
    from app.auth import auth_bp
    from app.passwords import passwords_bp
    from app.commands import commands_bp
    from app.routes import main_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(passwords_bp)
    app.register_blueprint(commands_bp)
    app.register_blueprint(main_bp)
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    return app