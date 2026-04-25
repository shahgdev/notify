from sqlalchemy import text
try:
    from backend.database import engine
except ImportError:
    from database import engine

with engine.connect() as conn:
    # Check users
    res = conn.execute(text("SELECT COUNT(*) FROM users")).fetchone()
    print(f"Users count: {res[0]}")
    
    if res[0] == 0:
        print("Adding a mock user for development...")
        conn.execute(text("INSERT INTO users (id, email, password_hash) VALUES (1, 'test@example.com', 'mock_hash')"))
        conn.commit()
    else:
        # Ensure user with ID 1 exists
        res_id = conn.execute(text("SELECT id FROM users WHERE id = 1")).fetchone()
        if not res_id:
            print("Changing user ID to 1 for consistency...")
            conn.execute(text("UPDATE users SET id = 1 WHERE id = (SELECT MIN(id) FROM users)"))
            conn.commit()

    # Add missing column if not exists
    from sqlalchemy import inspect
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('lectures')]
    if 'subject_id' not in columns:
        print("Adding subject_id column to lectures...")
        conn.execute(text("ALTER TABLE lectures ADD COLUMN subject_id INTEGER REFERENCES subjects(id)"))
        conn.commit()
    else:
        print("subject_id column already exists in lectures.")
