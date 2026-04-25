from sqlalchemy import text
try:
    from backend.database import engine
except ImportError:
    from database import engine

with engine.connect() as conn:
    print("--- All Lectures ---")
    lectures = conn.execute(text("SELECT id, user_id, subject_id, title, audio_path FROM lectures")).fetchall()
    for l in lectures:
        print(l)
