# TrackPulse India

TrackPulse India is a real-time railway intelligence and spatial tracking platform. It transforms generic train delay status messages (such as "Your train is 47 minutes late") into rich, actionable spatial context (such as "Your train is looped at Tundla Junction for Rajdhani Express overtake — estimated hold: 7 minutes").

By combining crowdsourced user telemetry, track network GeoJSON geometries, spatial algorithms, Kalman filtering, and a rule-based context engine, TrackPulse provides accurate insight into mainline holds, loop-line siding detours, and high-priority train overtakes across Indian Railways.

---

## Key Features

- **Context-Aware Delay Inference Engine**: Analyzes spatial relationship, speed, dwell time, and train priority to explain the exact physical reason behind a delay.
- **Loop-Line & Siding Detection**: Uses lateral track offset calculations (>18 meters from mainline vector) and station platform metadata to detect when a train has been diverted onto a loop line.
- **Overtake Prediction Engine**: Evaluates relative train speeds, priority levels (Rajdhani vs Superfast vs Mail/Express), distance behind, and upcoming siding capacities to predict overtakes before they happen.
- **Kalman Filtering & Noise Reduction**: Eliminates GPS jitter inside metal train coaches and filters out invalid speed spikes (>200 km/h jump rejection).
- **Interactive Map Visualization**: Built on MapLibre GL JS with glowing rail track overlays, diamond station markers, train speed vectors, and dynamic camera follow.
- **Light and Dark Mode**: Support for both Dark Matter vector tiles and CartoDB Positron daylight map styles.
- **Passenger View and Railfan Mode**: Toggle between high-level passenger summaries and detailed technical telemetry (block section occupancy, lateral offsets, and proximity radar).

---

## Monorepo Architecture

The repository is structured as a TypeScript monorepo:

```
TrackPulse/
├── apps/
│   └── web/                   # Next.js 14 Web Frontend Application
│       ├── app/               # Next.js App Router (page.tsx, layout.tsx, globals.css)
│       ├── components/        # UI Components
│       │   ├── common/        # ModeToggle, ThemeToggle
│       │   ├── gps/           # GPSReporter, Simulation Controller
│       │   ├── map/           # MapView (MapLibre GL JS integration)
│       │   └── panels/        # BottomSheet, ContextCard, SpeedPanel, NearbyTrains
│       └── stores/            # Zustand state management (trainStore.ts)
├── packages/
│   └── core/                  # Core Spatial Algorithms & Types
│       ├── algorithms/
│       │   ├── rail-snapper.ts       # Turf.js rail snapping & lateral offset
│       │   ├── kalman-filter.ts      # GPS noise filter & outlier rejection
│       │   ├── loop-detector.ts      # Loop siding & dwell detector
│       │   ├── overtake-predictor.ts # Relative speed & priority overtake engine
│       │   └── context-engine.ts     # Delay reasoning synthesizer
│       └── types/
│           └── train.ts              # Core TypeScript interfaces
├── services/
│   └── gateway/               # Backend Server (Fastify + Socket.io)
│       └── server.ts          # Telemetry pipeline & WebSocket engine
├── data/                      # Spatial Data Assets
│   ├── stations.json          # Indian Railway station database & platform coordinates
│   └── geojson/
│       └── routes/            # Route track vectors (e.g. 12393_NDLS_RJPB.json)
└── package.json               # Root workspace configuration
```

---

## Technical Stack

- **Frontend Framework**: Next.js 14 (React 18, TypeScript, Tailwind CSS)
- **Map Rendering**: MapLibre GL JS with CartoDB Dark Matter & Positron styles
- **Geospatial Processing**: Turf.js (line distance, nearest point on line, spatial offset)
- **Animation Physics**: Framer Motion
- **State Management**: Zustand
- **Backend Server**: Fastify 4, Socket.io 4, Node.js
- **Data Formats**: GeoJSON, JSON

---

## Core Algorithms Overview

### 1. Rail Snapper (`packages/core/algorithms/rail-snapper.ts`)
Converts raw GPS coordinates (latitude, longitude) into snapped coordinates aligned to the track network. Calculates:
- `snappedLat`, `snappedLng`: Projected track coordinates.
- `lateralOffset`: Distance in meters from track centerline.
- `kmMarker`: Kilometre distance along the route.

### 2. Kalman Filter (`packages/core/algorithms/kalman-filter.ts`)
Applies 1D Kalman filtering to GPS speed estimates to smooth noise caused by coach structures. Rejects reports exceeding physical thresholds (>200 km/h).

### 3. Loop Detector (`packages/core/algorithms/loop-detector.ts`)
Evaluates train state against sliding window criteria:
- Lateral offset > 18 meters from mainline line string.
- Current speed < 5 km/h.
- Dwell time > 60 seconds within station boundary buffer.

### 4. Overtake Predictor (`packages/core/algorithms/overtake-predictor.ts`)
Calculates overtake probability by scanning active trains on the same route segment:
- Compares train priority ratings (Priority 1: Rajdhani/Shatabdi, Priority 2: Vande Bharat, Priority 3: Superfast).
- Determines closing rate in km/h.
- Computes estimated time of overtake and identifies candidate siding stations.

### 5. Context Engine (`packages/core/algorithms/context-engine.ts`)
Combines algorithm outputs into clear human-readable delay cards with confidence scores and estimated hold times.

---

## Getting Started

### Prerequisites

- Node.js version 18 or higher
- npm version 9 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Unknownbeliek/RailTrack.git
   cd RailTrack
   ```

2. Install dependencies for the web workspace:
   ```bash
   cd apps/web
   npm install
   ```

---

## Running the Application

### Launch Web Client

To run the Next.js development server:

```bash
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied) in your web browser.

### Launch Backend Gateway (Optional)

To start the Fastify Socket.io backend gateway server:

```bash
cd services/gateway
npx ts-node server.ts
```

The gateway server listens on port `4000` and provides WebSocket communication alongside REST endpoints:
- `GET /health` : Health check status
- `GET /trains` : Active train list
- `GET /stations` : Station database

---

## Live Simulation Mode

The application includes an interactive simulation controller directly on the UI:

1. Click **Simulate Rajdhani Overtake** to trigger a real-time sequence:
   - Step 1: 12301 Howrah Rajdhani Express approaches behind 12393 Sampark Kranti Express at 112 km/h.
   - Step 2: 12393 is held on Tundla Junction Loop 1 while 12301 overtakes on the mainline at 124 km/h.
   - Step 3: 12393 receives track clearance and accelerates back to 88 km/h onto the mainline.
2. Toggle **Passenger View / Railfan Mode** to switch UI density.
3. Click the **Sun / Moon** icon to toggle between Dark and Light mode themes.

---

## License

MIT License. Developed for railway intelligence research and spatial analytics.
