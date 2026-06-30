import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "sql_app.db")

def migrate():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("Adding shift_type column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN shift_type VARCHAR DEFAULT 'full_day'")
        conn.commit()
        print("Migration successful!")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column shift_type already exists.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
