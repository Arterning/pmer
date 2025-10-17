from flask import render_template, Blueprint, redirect, url_for

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """渲染主页"""
    return render_template('index.html')

@main_bp.route('/auth')
def auth():
    """渲染登录/注册页面"""
    return render_template('auth.html')

@main_bp.route('/commands')
def commands():
    """渲染命令管理页面"""
    return render_template('commands.html')