# BioShield Android Edge Emulator 📱

This Android application serves as the physical "Smart Lock" scanning endpoint for the BioShield IoT Hackathon. Built natively in Kotlin, the app processes raw biometric images and seamlessly interfaces with our central API endpoints to provide a real-time hardware simulation.

## 🌟 Key Features
- **Minutiae Extraction Simulation:** Dynamically handles fingerprint workflows and packages biometric vector data to be sent to the backend for BioHashing.
- **Smart LED Indicator:** Natively visualizes physical IoT environment signals directly in the Android layout (Holo Red / Holo Green indicator arrays) to represent physical access grants or denials.
- **Dynamic Configuration:** Supports rapid deployment across devices with an integrated launch-screen networking configuration block. Developers can target different local backends or EC2 endpoints instantly without recompiling.
- **Live Polling:** Connects with the Redis-backed trigger endpoints to initiate enrollment/verification automatically when commanded by the Web Administrative Dashboard.

## 🛠 Architecture
- **Language:** Kotlin
- **Minimum SDK:** API 24 (Android 7.0)
- **Target SDK:** API 34 (Android 14)
- **Networking:** Retrofit2 & Gson, OkHttp Logging Interceptor
- **State Management:** Android ViewModels / LiveData Contexts
- **Security:** EncryptedSharedPreferences for local token storage

## 🚀 Getting Started

### Prerequisites
- Android Studio (Latest Version)
- Android Emulator (API 30+ recommended) or Physical Device
- The FastAPI Backend (`bioshieldiotapi`) must be running.

### Installation
1. Open Android Studio.
2. Select **Open an existing project** and navigate to the `bioshieldiotandroid` directory.
3. Allow Gradle to sync and download necessary dependencies.
4. Build the project (`Build > Make Project`).

### Running the App
Run the application on an emulator or a physical device connected via USB/Wi-Fi debugging.

### Endpoint Configuration
Upon launching the app, you will see a configuration screen for the backend URL:
- **For Android Emulator:** Use `http://10.0.2.2:8000/` (This routes securely to your host machine's `localhost`).
- **For Physical Devices:** Use your computer's local Wi-Fi IP address (e.g., `http://192.168.1.100:8000/`). Ensure both devices are on the same network.

## 🔐 Authentication
Use the accounts seeded by the backend script (`bioshieldiotapi/scripts/seed.py`) to log in:
- **Admin:** `admin@bioshield.io` / `admin123`
- **User:** `user@bioshield.io` / `user123`

## 🕹 Usage Workflow
1. Log in using the credentials above.
2. On the main dashboard, you can manually trigger **Enrollment** or **Verification**.
3. For the complete Hackathon demo, trigger the scanning events from the **Web Control Panel**. The Android app will intercept the Redis poll and automatically open the scanning prompt.
