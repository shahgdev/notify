import sqlite3
import os

db_path = "notify.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE lectures ADD COLUMN topic_tag TEXT")
        conn.commit()
        print("Successfully added topic_tag column to lectures table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column topic_tag already exists.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()
else:
    print(f"Database {db_path} not found.")
