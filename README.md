# BioShield IoT API 🛡️

The central nervous system for the BioShield Hackathon project. This FastAPI backend manages authentication, Redis-backed edge device polling, PostgreSQL data persistence, and the core mathematical logic for our non-invertible **BioHash** biometric transformations.

## 🌟 Key Features
- **Secure Biometrics:** Cryptographically secures raw minutiae vectors using non-invertible matrix projections (`BioHashing`), preventing biometric theft in the event of a database breach.
- **Dynamic Key Vault Framework:** Keys are uniquely generated per-template and encrypted with an `AES-256 GCM` master configuration. 
- **Live IoT Polling:** Rapid-access Redis layer synchronizes the Android edge-scanner signals directly to our React Administrative Control Panel.
- **Telemetry Streaming:** Full audit trails recorded seamlessly into PostgreSQL and accessible via the `/audit` endpoints.
- **Role-Based Access Control (RBAC):** Strict JWT-based decorators defining Admin, Security Officer, and User privileges.

## 🛠 Tech Stack
- **Framework:** FastAPI / Python 3.10+
- **Databases:** PostgreSQL (Persistence), Redis (High-speed Volatility & Sessions)
- **Math/Crypto:** Numpy, PyCryptodome, PASETO / JWT
- **ORM:** SQLAlchemy & Alembic (Migrations)

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- PostgreSQL Server running locally or via Docker
- Redis Server running locally or via Docker

### 2. Environment Setup
Create a `.env` file in the root of `bioshieldiotapi`:
```ini
ENVIRONMENT=development
DATABASE_URL=postgresql://user:password@localhost:5432/bioshield
REDIS_URL=redis://localhost:6379/0
# 32-byte base64 encoded master key for the vault
AES_MASTER_KEY=your_secure_base64_master_key_here
SECRET_KEY=your_jwt_secret_key_here
```

### 3. Installation & Migrations
Install the required packages in a virtual environment:
```bash
cd bioshieldiotapi
python -m venv venv
source venv/bin/activate  # Or `venv\Scriptsctivate` on Windows
pip install -r requirements.txt
```

Run database migrations to initialize tables:
```bash
alembic upgrade head
```

### 4. Seeding the Database
Generate initial test user roles (Admin, Security Officer, User) ensuring your database is ready for testing:
```bash
python scripts/seed.py
```

### 5. Running the API Server
Launch the uvicorn engine. To allow Android emulators and other devices on the network to connect, bind to `0.0.0.0`:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. API Documentation
Once running, interactive interactive API documentation is automatically generated:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
