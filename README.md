# BioShield IoT - Backend API

**BioShield IoT** is a secure, high-performance FastAPI backend designed for managing cancellable fingerprint biometrics. It aims to eliminate the danger of compromised biometrics by using a mathematical projection layer ("BioHash") instead of storing raw fingerprints, coupled with robust, immutable auditing and real-time session invalidation.

## 🚀 Features

- **Cancellable Biometrics**: Raw fingerprint vectors are deterministically projected into a `BioHash` bit-string using dynamically generated, encrypted NumPy projection matrices. If a biometric is compromised, the template can be seamlessly canceled and regenerating a new key seamlessly enables re-enrollment.
- **Advanced Cryptography**: Employs `AES-256-GCM` via PyCryptodome to encrypt projection seeds inside isolated KeyVault components.
- **Secure Authentication**: Uses modern PASETO (v4.local) token standard instead of JWT, coupled with bcrypt password hashing.
- **RBAC Roles**: 
  - `Admin`: User management & creation.
  - `Security Officer`: Granular audit log inspection & system telemetry.
  - `User`: Personal template enrollment, verification, and revocation.
- **Instant Revocation**: Redis-backed session blocklisting guarantees instant token revocation across the system when a biometric template is compromised or canceled.
- **Immutable Auditing**: Every authorization, verification, and biometric action strictly commits an unalterable log.

## 🛠️ Technology Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com)
- **Database**: PostgreSQL with [SQLAlchemy 2.0](https://www.sqlalchemy.org) ORM & Alembic purely for asynchronous migrations.
- **Caching & Blocklisting**: Redis
- **Cryptography**: [PyCryptodome](https://pycryptodome.readthedocs.io/en/latest/) (AES-GCM), [PySeta](https://pyseto.readthedocs.io/) (PASETO)
- **Mathematical Processing**: NumPy

## 📂 Project Structure

```text
bioshieldiot/
├── .env.example              # Environment variables template
├── requirements.txt          # Python dependencies
├── alembic/                  # Database schema migrations
├── scripts/
│   └── seed.py               # Database bootstrapping/seeding script
└── app/
    ├── main.py               # FastAPI entrypoint
    ├── config.py             # Pydantic BaseSettings config
    ├── database.py           # DB Engine & Dependency
    ├── redis_client.py       # Redis Connection Pool
    ├── models/               # SQLAlchemy Models (User, Template, Vault)
    ├── schemas/              # Pydantic validation boundaries
    ├── routers/              # Sub-routed endpoints (/users, /biometric)
    ├── services/             # Core business logic (Auth, Auditing)
    └── middleware/           # FastAPI dependency interception
```

## ⚙️ Local Development Setup

### 1. Requirements
- Python 3.10+
- PostgreSQL
- Redis Server

### 2. Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy the sample environment file and fill it with your local credentials, database URL, and cryptography master keys:
```bash
cp .env.example .env
```
*(Ensure `PASETO_SECRET_KEY` and `AES_MASTER_KEY` are properly generated 32-byte hex strings).*

### 4. Database Migrations
Initialize your database by running the Alembic migrations up to head:
```bash
alembic upgrade head
```

### 5. Seed Database
Automatically inject three foundational users (Admin, Security Officer, Standard User) and generate a functional 128-dimensional biometric profile for the standard user:
```bash
python scripts/seed.py
```

### 6. Start the Application
Run the Uvicorn development server:
```bash
uvicorn app.main:app --reload
```

## 🌐 API Overview

Once the application is running, the interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

| Route | Protocol | Description | RBAC Requirement |
| ----- | --- | ----------- | ---------------- |
| `/health` | `GET` | System heartbeat | Public |
| `/auth/login` | `POST` | Exchange email/pass for PASETO | Public |
| `/auth/logout` | `POST` | Instantly revoke access token | Authenticated |
| `/biometric/enroll` | `POST` | Register a new 128-dim fingerprint | `user` |
| `/biometric/verify` | `POST` | Check incoming biometric vs BioHash | `user` / `admin` |
| `/biometric/cancel` | `POST` | Revoke a compromised template | `user` / `admin` |
| `/users` | `GET`, `POST` | Manage system access levels | `admin` |
| `/audit` | `GET` | View paginated system actions logging | `security_officer` |
| `/stats` | `GET` | View system performance and DB health | `security_officer` |

## 🛡️ Auditing & Security Operations
Every single request that hits the API flows through `app/services/audit.py`, safely catching exceptions ensuring logging is strictly handled out-of-band but synchronously mapped to the database preventing unrecorded failures. Check `/audit` dynamically via the Security dashboard to track Hamming distance shifts or malicious login failures.