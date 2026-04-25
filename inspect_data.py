from sqlalchemy import text
try:
    from backend.database import engine
except ImportError:
    from database import engine

with engine.connect() as conn:
    print("--- Users ---")
    users = conn.execute(text("SELECT * FROM users")).fetchall()
    for u in users:
        print(u)
    
    print("\n--- Subjects ---")
    subjects = conn.execute(text("SELECT * FROM subjects")).fetchall()
    for s in subjects:
        print(s)

    print("\n--- Lectures (first 5) ---")
    lectures = conn.execute(text("SELECT id, user_id, subject_id, title FROM lectures LIMIT 5")).fetchall()
    for l in lectures:
        print(l)
