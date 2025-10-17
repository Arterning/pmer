"""
数据库迁移脚本
将旧的密码表结构迁移到新的加密方案

警告：这会删除现有数据库并重新创建！
如果有重要数据，请先备份！
"""

from app import create_app, db
from app.models import User, Password
import os

def migrate_database():
    app = create_app()

    with app.app_context():
        print("开始数据库迁移...")

        # 删除旧表
        print("删除旧表...")
        db.drop_all()

        # 创建新表
        print("创建新表...")
        db.create_all()

        print("数据库迁移完成！")
        print("\n注意：")
        print("1. 所有旧密码数据已被删除")
        print("2. 请重新注册用户并添加密码")
        print("3. 新方案将加密 title, url, username, password, notes")
        print("4. category 字段保持明文，用于分类筛选")

if __name__ == '__main__':
    # 确认操作
    confirm = input("警告：此操作将删除所有现有数据！是否继续？(yes/no): ")

    if confirm.lower() == 'yes':
        migrate_database()
    else:
        print("操作已取消")
