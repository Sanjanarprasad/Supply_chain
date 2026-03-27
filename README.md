# FarmTrace 🌾
### A QR-Based Agricultural Provenance System
**REVA University | AIDS Sem VI | 2026**

---

## How to Run (Step by Step)

### Step 1 — Make sure Node.js is installed
Open terminal and type:
```
node --version
```
If you see a version number (e.g. v18.x.x), you're good.
If not, download Node.js from: https://nodejs.org

### Step 2 — Open the project in VS Code
- Unzip the folder
- Open VS Code → File → Open Folder → select `farmtrace` folder

### Step 3 — Install dependencies
Open the VS Code terminal (Ctrl+`) and run:
```
npm install
```
Wait for it to finish (may take 1-2 minutes first time).

### Step 4 — Start the app
```
npm start
```
The app will open automatically at http://localhost:3000

---

## Features

| Tab | What it does |
|-----|-------------|
| 🌾 Farmer | Fill form → Register batch → Get QR code |
| 📋 Batches | View all registered batches |
| 📱 Scan QR | Camera scanner OR manual ID entry → See product details |

## Demo Batch IDs to test
- `FT-K9MX2A` — Cherry Tomato, Kolar (Organic)
- `FT-P3TZ8B` — Green Chilli, Tumkur (Conventional)  
- `FT-M7RQ4C` — Fresh Mango, Ramanagara (Natural farming)

## QR Scanner — How to test
1. Register a new batch in the Farmer tab
2. A QR code is generated
3. Go to Scan QR tab
4. Click "Open Camera Scanner" — allow camera permission
5. Point camera at the QR code on screen
6. OR type the batch ID (e.g. FT-K9MX2A) and click View

---

## Project Structure
```
farmtrace/
├── public/
│   └── index.html
├── src/
│   ├── App.js              ← Main app (all tabs)
│   ├── index.js            ← Entry point
│   ├── styles.css          ← All styling
│   ├── data.js             ← Demo data + ID generator
│   └── components/
│       ├── QRGenerator.js  ← Generates QR code image
│       └── QRScanner.js    ← Camera-based QR scanner
├── package.json
└── README.md
```
