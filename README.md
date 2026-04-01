# BioShield Administrative Control Panel 💻

The "Glass Box" security visualization web interface for the BioShield IoT Hackathon System. 

Designed to operate seamlessly alongside the Python backend and Android fingerprint scanner, this dashboard acts as the nerve center for managing administrative policies, triggering real-time hardware workflows, and providing live visual proof of our mathematical cryptographic structures.

## Key Features
- **Real-Time IoT Triggering:** Utilize control-panel hooks to remotely activate "Enrollment" and "Verification" physical scanning sequences to any synced Android emulator directly over our Redis polling loop.
- **Visual Proof Comparison:** Renders direct, comparative data between raw minutiae arrays and their irreversible binary counterparts post "BioHash" processing, acting as the ultimate demonstration piece for hackathon judges.
- **Live Auditing:** Polls active system analytics to push live metrics detailing access tracking, approval structures, and mathematical threshold distances.
- **Premium Aesthetics:** Constructed prioritizing rich, high-fidelity dark-mode typography frameworks, smooth transitions, and glassmorphism.

## Tech Stack
- **Framework:** React + TypeScript + Vite
- **Styling:** Vanilla CSS & curated UI tokens 

## Running the Dashboard
1. Ensure your backend `/bioshieldiotapi` instances are actively listening on `localhost:8000`.
2. Navigate root to `/bioshieldiotweb`.
3. Start the node server:
```bash
npm install
npm run dev
```
Navigate to your local port host (typically `http://localhost:5173`) to view the application.
