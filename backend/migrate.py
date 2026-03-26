import sys
import os
from dotenv import load_dotenv

# Force load the .env file so SQLAlchemy finds the remote Postgres host
load_dotenv('c:/Users/sertgwse/Documents/code/fyp2/backend/.env')
sys.path.append('c:/Users/sertgwse/Documents/code/fyp2/backend')

from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('ALTER TABLE agents ADD COLUMN IF NOT EXISTS token VARCHAR UNIQUE;'))
    conn.commit()

print("Schema migration complete.")
