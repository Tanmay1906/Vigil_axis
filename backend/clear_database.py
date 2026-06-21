#!/usr/bin/env python
"""
Clear the Neon PostgreSQL database - drops all tables to start fresh.
Run this before restarting the app to reset the prototype.
"""

import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("HASH_INDEX_DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: HASH_INDEX_DATABASE_URL not found in .env")
    exit(1)

print(f"Connecting to database...")
try:
    conn = psycopg.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Get all public tables
    cursor.execute("""
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    """)
    tables = cursor.fetchall()
    
    if not tables:
        print("✓ Database is already empty - no tables to drop")
        cursor.close()
        conn.close()
        exit(0)
    
    print(f"Found {len(tables)} table(s) to truncate:")
    for (table,) in tables:
        print(f"  - {table}")
    
    # Truncate all tables (keeps schema, clears data)
    for (table,) in tables:
        cursor.execute(f"TRUNCATE TABLE {table} CASCADE")
    conn.commit()
    print("✓ All tables truncated successfully (data cleared, schema preserved)")
    
    cursor.close()
    conn.close()
    print("✓ Database cleared. Schema preserved. Run 'python run.py' to start fresh with new data.")
    
except Exception as e:
    print(f"ERROR: {e}")
    exit(1)
