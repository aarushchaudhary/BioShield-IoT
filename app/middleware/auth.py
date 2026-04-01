"""
Auth middleware — FastAPI dependency for extracting & validating the
Bearer token from the Authorization header.

For the Hackathon Demo, this is mocked to return a static admin user.
"""

def get_current_user() -> dict:
    """FastAPI dependency — returns a mock admin payload."""
    return {"user_id": "demo-hackathon-user-001", "role": "admin"}
