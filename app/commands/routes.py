from flask import request, jsonify
from app import db
from app.models import Command
from app.commands import commands_bp
from app.auth.routes import token_required

@commands_bp.route('/', methods=['GET'])
@token_required
def get_all_commands(current_user, master_key):
    """获取用户的所有命令条目"""
    commands = Command.query.filter_by(user_id=current_user.id).all()

    return jsonify({
        'commands': [cmd.to_dict() for cmd in commands]
    }), 200

@commands_bp.route('/<int:command_id>', methods=['GET'])
@token_required
def get_command(current_user, master_key, command_id):
    """获取特定命令条目"""
    command = Command.query.filter_by(id=command_id, user_id=current_user.id).first()

    if not command:
        return jsonify({'message': '命令条目不存在'}), 404

    return jsonify(command.to_dict()), 200

@commands_bp.route('/', methods=['POST'])
@token_required
def create_command(current_user, master_key):
    """创建新的命令条目"""
    data = request.get_json()

    # 验证必要字段
    if not all(k in data for k in ('name', 'command_text')):
        return jsonify({'message': '缺少必要字段'}), 400

    try:
        # 创建新命令条目
        new_command = Command(
            name=data['name'],
            command_type=data.get('command_type', ''),
            command_text=data['command_text'],
            user_id=current_user.id
        )

        db.session.add(new_command)
        db.session.commit()

        return jsonify({
            'message': '命令条目创建成功',
            'command': new_command.to_dict()
        }), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'创建失败: {str(e)}'}), 400

@commands_bp.route('/<int:command_id>', methods=['PUT'])
@token_required
def update_command(current_user, master_key, command_id):
    """更新命令条目"""
    command = Command.query.filter_by(id=command_id, user_id=current_user.id).first()

    if not command:
        return jsonify({'message': '命令条目不存在'}), 404

    data = request.get_json()

    try:
        # 更新字段
        if 'name' in data:
            command.name = data['name']
        if 'command_type' in data:
            command.command_type = data['command_type']
        if 'command_text' in data:
            command.command_text = data['command_text']

        db.session.commit()

        return jsonify({
            'message': '命令条目更新成功',
            'command': command.to_dict()
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'更新失败: {str(e)}'}), 400

@commands_bp.route('/<int:command_id>', methods=['DELETE'])
@token_required
def delete_command(current_user, master_key, command_id):
    """删除命令条目"""
    command = Command.query.filter_by(id=command_id, user_id=current_user.id).first()

    if not command:
        return jsonify({'message': '命令条目不存在'}), 404

    db.session.delete(command)
    db.session.commit()

    return jsonify({'message': '命令条目删除成功'}), 200

@commands_bp.route('/types', methods=['GET'])
@token_required
def get_command_types(current_user, master_key):
    """获取用户的所有命令类型"""
    types = db.session.query(Command.command_type).filter_by(user_id=current_user.id).distinct().all()
    return jsonify({
        'types': [t[0] for t in types if t[0]]
    }), 200
