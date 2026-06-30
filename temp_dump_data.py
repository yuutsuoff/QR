import sqlite3
import os

db_path = r'c:\Users\AliCom\Documents\PROJECTS\ITLive QR Attendance System\backend\sql_app.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- USERS ---")
    cursor.execute("SELECT name, email, role, created_at FROM users")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- OFFICES ---")
    cursor.execute("SELECT name, location FROM offices")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- ATTENDANCE ---")
    cursor.execute("SELECT user_id, date, check_in FROM attendance")
    for row in cursor.fetchall():
        print(row)
        
    conn.close()
else:
    print("DB not found")
