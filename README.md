# BioShield Administrative Control Panel 💻

The "Glass Box" security visualization web interface for the BioShield IoT Hackathon System. 

Designed to operate alongside the Python backend and Android fingerprint scanner, this dashboard acts as the nerve center for managing administrative policies, triggering real-time hardware workflows, and providing live visual proof of our mathematical cryptographic structures.

## 🌟 Key Features
- **Real-Time IoT Triggering:** Utilize control-panel hooks to remotely activate "Enrollment" and "Verification" physical scanning sequences to any synced Android emulator directly over our Redis polling loop.
- **Visual Proof Comparison:** Renders direct, comparative data between raw minutiae arrays and their irreversible binary counterparts post "BioHash" processing. This is the ultimate demonstration piece for hackathon judges.
- **Live Auditing:** Polls active system analytics to push live metrics detailing access tracking, approval structures, and mathematical threshold distances.
- **Premium Aesthetics:** Constructed prioritizing rich, high-fidelity dark-mode typography frameworks, smooth transitions, and glassmorphism.

## 🛠 Tech Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS & Custom UI Tokens
- **State/API:** Axios & React Context

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Ensure the FastAPI backend (`/bioshieldiotapi`) is running on your network (usually `localhost:8000`).

### Installation
1. Navigate to the web portal directory:
   ```bash
   cd bioshieldiotweb
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
You can configure the API endpoint through the UI or environment variables:
1. Create a `.env.local` file in the root of `bioshieldiotweb`:
   ```bash
   VITE_API_URL=http://localhost:8000
   ```
2. **Alternatively (UI Method):** Once the app is running, click the **⚙️ Settings** icon in the top right to configure your Backend API URL dynamically. This is useful for testing across different networks.

### Running the Development Server
```bash
npm run dev
```
Navigate to your local port host (typically `http://localhost:5173`) to view the application.

### Building for Production
```bash
npm run build
npm run preview
```

## 🌐 Network Considerations
If you are testing with the Android app on the same WiFi network, make sure to set the API URL in the Web Portal to your machine's local IP address (e.g., `http://192.168.1.100:8000`) instead of `localhost`.
