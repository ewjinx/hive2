import sys
sys.path.append('.')
from app.db.session import engine
from app.models.transaction import Transaction

try:
    Transaction.metadata.create_all(bind=engine)
    print("Transaction table successfully synchronized with PostgreSQL.")
except Exception as e:
    print(f"Error migrating transaction table: {e}")
