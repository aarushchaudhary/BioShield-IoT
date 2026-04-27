# BioShield IoT System 🛡️

This repository contains the complete source code for the BioShield IoT Hackathon System. It is composed of three main components:
1. **Android Client (`android-client`)**: A physical "Smart Lock" scanning endpoint emulator.
2. **Python Backend (`python-backend`)**: A FastAPI backend managing authentication, Redis polling, and BioHashing logic.
3. **Web Frontend (`web-frontend`)**: A React administrative dashboard for managing policies and visualizing biometric structures.

---

## 📱 Android Client (BioShield Android Edge Emulator)

This Android application serves as the physical "Smart Lock" scanning endpoint for the BioShield IoT Hackathon. Built natively in Kotlin, the app processes raw biometric images and seamlessly interfaces with our central API endpoints to provide a real-time hardware simulation.

### 🌟 Key Features
- **Minutiae Extraction Simulation:** Dynamically handles fingerprint workflows and packages biometric vector data to be sent to the backend for BioHashing.
- **Smart LED Indicator:** Natively visualizes physical IoT environment signals directly in the Android layout (Holo Red / Holo Green indicator arrays) to represent physical access grants or denials.
- **Dynamic Configuration:** Supports rapid deployment across devices with an integrated launch-screen networking configuration block. Developers can target different local backends or EC2 endpoints instantly without recompiling.
- **Live Polling:** Connects with the Redis-backed trigger endpoints to initiate enrollment/verification automatically when commanded by the Web Administrative Dashboard.

### 🛠 Architecture
- **Language:** Kotlin
- **Minimum SDK:** API 24 (Android 7.0)
- **Target SDK:** API 34 (Android 14)
- **Networking:** Retrofit2 & Gson, OkHttp Logging Interceptor
- **State Management:** Android ViewModels / LiveData Contexts
- **Security:** EncryptedSharedPreferences for local token storage

### 🚀 Getting Started

#### Prerequisites
- Android Studio (Latest Version)
- Android Emulator (API 30+ recommended) or Physical Device
- The FastAPI Backend must be running.

#### Endpoint Configuration
Upon launching the app, you will see a configuration screen for the backend URL:
- **For Android Emulator:** Use `http://10.0.2.2:8000/` (This routes securely to your host machine's `localhost`).
- **For Physical Devices:** Use your computer's local Wi-Fi IP address (e.g., `http://192.168.1.100:8000/`). Ensure both devices are on the same network.

#### 🔐 Authentication
Use the accounts seeded by the backend script (`python-backend/scripts/seed.py`) to log in:
- **Admin:** `admin@bioshield.io` / `admin123`
- **User:** `user@bioshield.io` / `user123`

#### 🕹 Usage Workflow
1. Log in using the credentials above.
2. On the main dashboard, you can manually trigger **Enrollment** or **Verification**.
3. For the complete Hackathon demo, trigger the scanning events from the **Web Control Panel**. The Android app will intercept the Redis poll and automatically open the scanning prompt.

---

## 🐍 Python Backend (BioShield IoT API)

The central nervous system for the BioShield Hackathon project. This FastAPI backend manages authentication, Redis-backed edge device polling, PostgreSQL data persistence, and the core mathematical logic for our non-invertible **BioHash** biometric transformations.

### 🌟 Key Features
- **Secure Biometrics:** Cryptographically secures raw minutiae vectors using non-invertible matrix projections (`BioHashing`), preventing biometric theft in the event of a database breach.
- **Dynamic Key Vault Framework:** Keys are uniquely generated per-template and encrypted with an `AES-256 GCM` master configuration. 
- **Live IoT Polling:** Rapid-access Redis layer synchronizes the Android edge-scanner signals directly to our React Administrative Control Panel.
- **Telemetry Streaming:** Full audit trails recorded seamlessly into PostgreSQL and accessible via the `/audit` endpoints.
- **Role-Based Access Control (RBAC):** Strict JWT-based decorators defining Admin, Security Officer, and User privileges.

### 🛠 Tech Stack
- **Framework:** FastAPI / Python 3.10+
- **Databases:** PostgreSQL (Persistence), Redis (High-speed Volatility & Sessions)
- **Math/Crypto:** Numpy, PyCryptodome, PASETO / JWT
- **ORM:** SQLAlchemy & Alembic (Migrations)

### 🚀 Getting Started

#### 1. Prerequisites
- Python 3.10+
- PostgreSQL Server running locally or via Docker
- Redis Server running locally or via Docker

#### 2. Environment Setup
Create a `.env` file in the root of `python-backend`:
```ini
ENVIRONMENT=development
DATABASE_URL=postgresql://user:password@localhost:5432/bioshield
REDIS_URL=redis://localhost:6379/0
# 32-byte base64 encoded master key for the vault
AES_MASTER_KEY=your_secure_base64_master_key_here
SECRET_KEY=your_jwt_secret_key_here
```

#### 3. Installation & Migrations
Install the required packages in a virtual environment:
```bash
cd python-backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

Run database migrations to initialize tables:
```bash
alembic upgrade head
```

#### 4. Seeding the Database
Generate initial test user roles (Admin, Security Officer, User) ensuring your database is ready for testing:
```bash
python scripts/seed.py
```

#### 5. Running the API Server
Launch the uvicorn engine. To allow Android emulators and other devices on the network to connect, bind to `0.0.0.0`:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 6. API Documentation
Once running, interactive API documentation is automatically generated:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## 💻 Web Frontend (BioShield Administrative Control Panel)

The "Glass Box" security visualization web interface for the BioShield IoT Hackathon System. 

Designed to operate alongside the Python backend and Android fingerprint scanner, this dashboard acts as the nerve center for managing administrative policies, triggering real-time hardware workflows, and providing live visual proof of our mathematical cryptographic structures.

### 🌟 Key Features
- **Real-Time IoT Triggering:** Utilize control-panel hooks to remotely activate "Enrollment" and "Verification" physical scanning sequences to any synced Android emulator directly over our Redis polling loop.
- **Visual Proof Comparison:** Renders direct, comparative data between raw minutiae arrays and their irreversible binary counterparts post "BioHash" processing. This is the ultimate demonstration piece for hackathon judges.
- **Live Auditing:** Polls active system analytics to push live metrics detailing access tracking, approval structures, and mathematical threshold distances.
- **Premium Aesthetics:** Constructed prioritizing rich, high-fidelity dark-mode typography frameworks, smooth transitions, and glassmorphism.

### 🛠 Tech Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS & Custom UI Tokens
- **State/API:** Axios & React Context

### 🚀 Getting Started

#### Prerequisites
- Node.js (v18+)
- Ensure the FastAPI backend (`/python-backend`) is running on your network (usually `localhost:8000`).

#### Installation
1. Navigate to the web portal directory:
   ```bash
   cd web-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

#### Configuration
You can configure the API endpoint through the UI or environment variables:
1. Create a `.env.local` file in the root of `web-frontend`:
   ```bash
   VITE_API_URL=http://localhost:8000
   ```
2. **Alternatively (UI Method):** Once the app is running, click the **⚙️ Settings** icon in the top right to configure your Backend API URL dynamically. This is useful for testing across different networks.

#### Running the Development Server
```bash
npm run dev
```
Navigate to your local port host (typically `http://localhost:5173`) to view the application.

#### Building for Production
```bash
npm run build
npm run preview
```

#### 🌐 Network Considerations
If you are testing with the Android app on the same WiFi network, make sure to set the API URL in the Web Portal to your machine's local IP address (e.g., `http://192.168.1.100:8000`) instead of `localhost`.
