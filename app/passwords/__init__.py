from flask import Blueprint

passwords_bp = Blueprint('passwords', __name__, url_prefix='/api/passwords')

from . import routes