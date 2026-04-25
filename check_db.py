from sqlalchemy import inspect
import os
try:
    from backend.database import engine
except ImportError:
    from database import engine

inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables: {tables}")

for table in tables:
    columns = [c['name'] for c in inspector.get_columns(table)]
    print(f"Table {table} columns: {columns}")
