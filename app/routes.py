from flask import render_template, Blueprint

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """渲染主页"""
    return render_template('index.html')