from sqlalchemy import text
try:
    from backend.database import engine
except ImportError:
    from database import engine

try:
    with engine.begin() as conn:
        print("Attempting to insert subject...")
        conn.execute(text("INSERT INTO subjects (name, user_id) VALUES ('Test Subject', 1)"))
        print("Success!")
except Exception as e:
    print(f"Failed to insert subject: {e}")
