import os
import sys
import argparse
import random
import logging

# Ensure 'app' is resolvable when calling from root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.template import Template, TemplateStatus
from app.models.key_vault import KeyVault
from app.models.audit_log import AuditAction
from app.services.auth import hash_password
from app.routers.biometric import encrypt_key, compute_biohash
from app.services.audit import log_event

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_fake_feature_vector(dim=128):
    return [random.uniform(-1.0, 1.0) for _ in range(dim)]

def seed_db():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            logger.info("Database already seeded. Aborting to prevent duplicates.")
            return
            
        logger.info("Starting seed process...")
        
        # Insert admin user
        admin = User(
            email="admin@bioshield.local",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
            is_active=True
        )
        db.add(admin)
        
        # Insert security officer
        security = User(
            email="security@bioshield.local",
            hashed_password=hash_password("security123"),
            role=UserRole.security_officer,
            is_active=True
        )
        db.add(security)
        
        # Insert standard user
        user1 = User(
            email="user@bioshield.local",
            hashed_password=hash_password("user123"),
            role=UserRole.user,
            is_active=True
        )
        db.add(user1)
        
        db.commit()
        db.refresh(admin)
        db.refresh(security)
        db.refresh(user1)
        
        logger.info("Users seeded: (admin@..., security@..., user@...)")
        
        # Generate initial biometric template for 'user'
        fake_vector = generate_fake_feature_vector()
        raw_key = os.urandom(32)
        encrypted_str = encrypt_key(raw_key)
        
        biohash_str = compute_biohash(fake_vector, raw_key)
        
        kv = KeyVault(
            user_id=user1.id,
            encrypted_key=encrypted_str
        )
        db.add(kv)
        db.flush()
        
        tmpl = Template(
            user_id=user1.id,
            biohash=biohash_str,
            key_reference=kv.id,
            status=TemplateStatus.active,
            version=1
        )
        db.add(tmpl)
        db.commit()
        
        # Log the enrollment success
        log_event(db, user1.id, AuditAction.enroll, True, "127.0.0.1")
        
        logger.info(f"Generated biometric template for standard user. Biohash: {biohash_str[:12]}...")
        logger.info("Seed successful.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
