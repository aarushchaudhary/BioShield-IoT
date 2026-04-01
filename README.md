# BioShield IoT API 🛡️

The central nervous system for the BioShield Hackathon project. This FastAPI backend manages authentication, Redis-backed edge device polling, PostgreSQL data persistence, and the core mathematical logic for our non-invertible **BioHash** biometric transformations.

## Key Features
- **Secure Biometrics:** Cryptographically secures raw minutiae vectors using non-invertible matrix projections (`BioHashing`), preventing biometric theft in the event of a database breach.
- **Dynamic Key Vault Framework:** Keys are uniquely generated per-template and encrypted with an `AES-256 GCM` master configuration. 
- **Live IoT Polling:** Rapid-access Redis layer synchronizes the Android edge-scanner signals directly to our React Administrative Control Panel (`POST /device/trigger-*`).
- **Telemetry Streaming:** Full audit trails recorded seamlessly into PostgreSQL and pushed over the `/audit/latest` endpoints.

## Tech Stack
- **Framework:** FastAPI / Python 3
- **Databases:** PostgreSQL (Persistence), Redis (High-speed Volatility & Sessions)
- **Math/Crypto:** Numpy, PyCryptodome, PASETO (Stateless Tokens)

## Getting Started

### 1. Environment Setup
Configure your `.env` connection strings:
```ini
ENVIRONMENT=development
DATABASE_URL=postgresql://user:pass@localhost:5432/bioshield
REDIS_URL=redis://localhost:6379/0
AES_MASTER_KEY=...
```

### 2. Seeding the Database
Generate initial test user roles (Admin, Security Officer, User) ensuring your database is ready for testing:
```bash
python scripts/seed.py
```

### 3. Run the Server
Launch the uvicorn engine mapping to all internal IP layouts for Android emulation limits:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
View the swagger docs by navigating to `http://localhost:8000/docs`.