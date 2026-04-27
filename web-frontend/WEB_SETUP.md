# BioShield IoT Web Portal - Setup & Usage Guide

## 📋 Prerequisites

- **Node.js 16+** installed
- **FastAPI Backend** running (see `/bioshieldiotapi` README)
- **Same network** as the FastAPI backend

---

## 🚀 Getting Started

### **1. Install Dependencies**

```bash
cd /home/chaudhary/bioshieldiot/bioshieldiotweb
npm install
```

### **2. Configure API URL**

#### **Option A: Using Environment Variable**

Create a `.env.local` file (or copy from `.env.example`):

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_URL=https://192.168.1.100:8000/
```

Replace `192.168.1.100` with your actual Windows WiFi IP.

#### **Option B: Using the UI Settings (Easiest)**

1. Run the development server (see below)
2. Click the **⚙️ Settings button** in the top-right corner
3. Enter your API URL (e.g., `192.168.1.100:8000`)
4. Click **Test Connection** to verify
5. Click **Save**

The URL will be saved to browser's `localStorage` and persists across page reloads.

---

## 🛠️ Development Mode

```bash
npm run dev
```

Opens at: `http://localhost:5173/`

The app will auto-reload when you make changes.

---

## 🏗️ Production Build

```bash
npm run build
npm run preview
```

---

## 📱 Connecting to Backend

### **For Windows Host Machine:**

1. **Find your Windows WiFi IP:**
   ```powershell
   ipconfig | findstr /C:"IPv4 Address" | findstr /v "127.0.0"
   ```
   Look for something like: `192.168.1.100` or `10.x.x.x`

2. **Start FastAPI backend on Windows:**
   ```bash
   cd bioshieldiotapi
   ./start_server.ps1  # or start_server.bat
   ```

3. **In web portal settings:**
   - Enter: `192.168.1.100:8000` (or your IP)
   - Click **Test Connection**
   - Should show ✅ Connected

### **For Android Emulator:**

1. **Start FastAPI on Windows**

2. **In web portal settings:**
   - Enter: `10.0.2.2:8000` (Android emulator default host IP)

### **For Physical Android Device:**

1. **Ensure phone is on same WiFi as computer**

2. **Start FastAPI on Windows with your WiFi IP**

3. **In Android phone:**
   - Enter same IP as web portal

---

## 🔌 API Endpoints Used

The web portal connects to these FastAPI endpoints:

```
GET  /health                    ← Health check
GET  /stats                     ← Overall statistics
POST /device/trigger-enrollment ← Trigger biometric enrollment
POST /biometric/cancel          ← Revoke template
GET  /audit                     ← Audit logs
GET  /stats/simulate-breach     ← Simulate security breach
GET  /stats/visualize/{user_id} ← Get biometric visualization
```

---

## ⚙️ Configuration

The web app uses a smart configuration system:

1. **localStorage** - Saves user's custom API URL in browser
2. **Environment variables** - Set via `.env.local` or `.env` files
3. **Defaults** - Falls back to `https://localhost:8000/`

### **Changing API URL at Runtime**

Click the **Settings ⚙️** button in the top-right corner and:

1. Enter new API URL
2. Click **Test Connection** to verify
3. Click **Save** to apply

Changes take effect immediately!

---

## 🔒 HTTPS & Self-Signed Certificates

The FastAPI backend uses **self-signed certificates** for development.

The web app automatically:
- Trusts self-signed certificates in development mode
- Uses `https://` protocol
- Validates certificate chain (can be disabled in settings if needed)

---

## 🐛 Troubleshooting

### **"Failed to fetch" or Network Error**

1. **Check FastAPI is running:**
   ```powershell
   # Test from Windows
   curl -k https://localhost:8000/health
   ```

2. **Check firewall allows port 8000:**
   ```powershell
   # Allow port 8000
   New-NetFirewallRule -DisplayName "FastAPI" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```

3. **Check API URL in browser settings** ⚙️
   - Should match your Windows IP
   - Format: `192.168.1.100:8000` or `https://192.168.1.100:8000`

4. **Check CORS is enabled** in FastAPI
   - Should allow `*` origins (development setting)

### **"Cannot GET /api"**

This is normal! The web app doesn't use `/api` prefix. Endpoints are direct:
- ✅ `https://192.168.1.100:8000/stats`
- ❌ `https://192.168.1.100:8000/api/stats`

### **Settings not saving**

- Check browser's `localStorage` is enabled
- Try clearing browser cache and cookies
- Try a different browser (Chrome, Firefox, Safari)

---

## 📊 Features

- ✅ **Real-time Dashboard** - View system statistics
- ✅ **Biometric Enrollment** - Trigger fingerprint enrollment on devices
- ✅ **Biometric Verification** - Test verification workflow
- ✅ **Template Revocation** - Cancel biometric templates
- ✅ **Breach Simulation** - Security testing
- ✅ **Audit Logs** - View system events
- ✅ **Live Metrics** - FAR/FRR, database status, etc.

---

## 🚀 Next Steps

1. **Configure API URL** using Settings ⚙️
2. **Click "Test Connection"** to verify
3. **Explore the dashboard** - Try enrollment, verification, etc.
4. **Check Android app** connects to same backend
5. **Test end-to-end** flow

---

## 📝 Notes

- Web portal runs on: `http://localhost:5173/` (development)
- API backend runs on: `https://[your-ip]:8000/`
- Both must be on same network for physical devices
- Emulator has special routing (10.0.2.2 = host IP)
- All data is stored in PostgreSQL (via API)

---

For API documentation, visit: `https://your-ip:8000/docs`
