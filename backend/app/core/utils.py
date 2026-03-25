import logging
from app.models.user import User

logger = logging.getLogger(__name__)

def send_low_balance_email(user: User) -> None:
    """
    Mock function to simulate sending an email to a user when their balance is critically low.
    In a real-world scenario, this would use a service like SendGrid, AWS SES, or SMTP.
    """
    email_body = f"""
    ========================================================
    [MOCK EMAIL SENT]
    To: {user.email}
    Subject: CRITICAL: Your Hive Balance is Low!
    
    Hi {user.email},
    
    This is an automated alert from Hive.
    Your current compute credit balance has dropped to {user.balance:.2f} credits!
    
    To avoid disruption to your CI/CD pipelines and agent jobs, 
    please log into the dashboard and Add Credits as soon as possible.
    
    - The Hive Team
    ========================================================
    """
    logger.warning(email_body)
    print(email_body)
