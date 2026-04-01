# BioShield Android Edge Emulator 📱

This Android application serves as the physical "Smart Lock" scanning endpoint for the BioShield IoT Hackathon. Built natively in Kotlin, the app processes raw biometric images and seamlessly interfaces with our central API endpoints. 

## Key Features
- **Minutiae Extraction:** Utilizes SourceAFIS internally to dynamically extract feature-vector paths from `FVC2002` fingerprint simulation bitmap data.
- **Smart LED Indicator:** Natively visualizes physical IoT environment signals directly in the Android layout (Holo Red / Holo Green indicator arrays).
- **Dynamic Configuration:** Supports rapid deployment across devices with an integrated launch-screen networking configuration block, allowing developers to target different EC2 backend endpoints instantly without recompiling.
- **Secure Networking Flow:** Tightly mirrors the `HTTP 422 Unprocessable` protections of our Python backend, accurately delivering structural UUID serialization mappings via Gson/Retrofit frameworks.

## Architecture
- **Language:** Kotlin
- **Networking:** Retrofit2 & Gson
- **State Management:** Android ViewModels / LiveData Contexts
- **Fingerprint Engine:** SourceAFIS (Minutiae logic mapping)

## Deployment / Testing
**1. Fast Boot Limits**
The app natively configures local emulation limits to map directly locally out of the box. Booting up with `http://10.0.2.2:8000/` ensures instantaneous feedback routing direct to the Python APIs looping on your laptop.

**2. Demo Targeting**
If loading onto a physical device over USB debugging, manually override the Backend Server URL block with your hosting IP (`http://192.x.x.x:8000/`) before hitting Login. 

### Auth Seeding:
* **Admin:** `admin@bioshield.io` / `admin123`
* **User:** `user@bioshield.io` / `user123`
