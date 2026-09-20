# MERN Migration Architecture: TrackPulse India

## Executive Summary

TrackPulse India has been migrated from a Next.js 14 full-stack setup into a decoupled **MERN architecture** (MongoDB, Express, React, Node.js) with client-side SPA routing and real-time bidirectional WebSocket synchronization.

```
                          TrackPulse India (MERN Monorepo)
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                                                                 │
   apps/client                                                       apps/server
(Vite React 18 + MapLibre                                    (Express + Socket.io + JWT
 + Zustand + React Router                                     + Multi-DB Abstraction Layer
 + Tailwind CSS)                                              + Spatial Telemetry Pipeline)
        │                                                                 │
        └─────────────── HTTP REST (/api/*) & WebSockets ─────────────────┘
```

---

## 1. Architectural Evolution: Before vs. After

| Feature | Legacy Setup (`apps/web` Next.js 14) | MERN Setup (`apps/client` + `apps/server`) |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 App Router (SSR/RSC) | **Vite + React 18 SPA** (`apps/client`) |
| **Routing** | File-system App Router (`app/page.tsx`) | **React Router v6** (`/`, `/train/:trainNo`, auth modals) |
| **Backend Server** | Fastify (`services/gateway`) + Next API | **Express 4 + Socket.io** (`apps/server`) |
| **State Management** | Zustand (Client-only memory) | **Zustand + JWT Auth Store + Socket.io Store** |
| **Database Layer** | Static JSON files (`data/stations.json`) | **Multi-DB Adapter (`memory`, `mongodb`, `postgres`, `sqlite`)** |
| **Authentication** | None | **JWT Bearer Token Auth** (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) |
| **Map Rendering** | MapLibre GL JS | **MapLibre GL JS (Preserving all 17 IR Zones + Tracks + Speed Badges)** |
| **Telemetry Ingestion**| Gateway WebSocket only | **REST API (`POST /api/trains/:trainNo/telemetry`) & Socket.io (`gps:report`)** |
| **Development Build** | `next dev` | Fast Vite HMR (`vite`) + TSX Node reload (`tsx watch`) |

---

## 2. Monorepo Directory Structure

```
RailTrack/
├── apps/
│   ├── client/                      # Standalone React SPA Frontend (Vite)
│   │   ├── index.html               # SPA Entrypoint HTML
│   │   ├── vite.config.ts           # Vite Bundler & Dev Proxy configuration
│   │   ├── tailwind.config.js       # TrackPulse Dark/Light Theme Tokens
│   │   ├── public/
│   │   │   ├── geojson/             # GeoJSON spatial datasets (zones, tracks, speeds)
│   │   │   └── styles/              # MapLibre GL style definitions
│   │   └── src/
│   │       ├── main.tsx             # Root bootstrap & BrowserRouter mount
│   │       ├── App.tsx              # Application layout & URL route definitions
│   │       ├── index.css            # MapLibre styling, pulse animations, speed badge CSS
│   │       ├── types/               # Train, station, user, and spatial TypeScript interfaces
│   │       ├── lib/                 # Map styling constants, zone colors, speed palettes
│   │       ├── stores/              # Zustand state stores: trainStore.ts, authStore.ts
│   │       ├── services/            # Axios/Fetch API client (api.ts) & Socket.io client (socket.ts)
│   │       └── components/
│   │           ├── map/             # MapView.tsx (MapLibre GL layers: zones, tracks, badges, trains)
│   │           ├── header/          # Header.tsx (Search, simulation buttons, mode/theme switches)
│   │           ├── panels/          # BottomSheet.tsx, ContextCard.tsx, SpeedPanel.tsx, NearbyTrains.tsx
│   │           ├── common/          # ModeToggle.tsx, ThemeToggle.tsx
│   │           └── auth/            # AuthModal.tsx (Sign In, Register, quick demo credentials)
│   │
│   ├── server/                      # Standalone Express + MongoDB/Multi-DB API Server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts             # Express application & HTTP / Socket.io server bootstrap
│   │       ├── config/              # Environment configuration & data path resolvers
│   │       ├── db/                  # Database abstraction layer
│   │       │   ├── types.ts         # IDatabase interface definition
│   │       │   ├── memory.ts        # In-memory adapter (zero external dependencies)
│   │       │   ├── mongo.ts         # Mongoose adapter (with automated memory fallback)
│   │       │   ├── sqlite.ts        # Relational SQLite abstraction adapter
│   │       │   ├── postgres.ts      # PostgreSQL enterprise abstraction adapter
│   │       │   └── index.ts         # getDatabase() factory singleton
│   │       ├── middleware/          # JWT auth middleware (authRequired, optionalAuth)
│   │       ├── routes/              # REST Endpoints:
│   │       │   ├── auth.ts          # /api/auth (register, login, me)
│   │       │   ├── trains.ts        # /api/trains (trains, telemetry, overtake simulation)
│   │       │   ├── stations.ts      # /api/stations (search and zone filtering)
│   │       │   ├── zones.ts         # /api/zones (17 IR zones metadata & geojson)
│   │       │   ├── tracks.ts        # /api/tracks (tracks with speeds & badges geojson)
│   │       │   └── health.ts        # /api/health (uptime, dbType, metrics)
│   │       ├── socket/              # Socket.io connection and live telemetry handlers
│   │       ├── spatial/             # Core spatial pipeline integration (Kalman, Snapping, Loop, Context)
│   │       └── seed/                # Seed trains and station loaders
│   │
│   └── web/                         # Legacy Next.js 14 monorepo package (preserved)
│
├── packages/
│   └── core/                        # Spatial intelligence algorithms
│       ├── algorithms/
│       │   ├── rail-snapper.ts      # Turf.js track snapping & lateral offset calculation
│       │   ├── kalman-filter.ts     # 1D Kalman filter for GPS jitter elimination
│       │   ├── loop-detector.ts     # Loop siding diversion & dwell identification
│       │   ├── overtake-predictor.ts# Relative speed & closing rate engine
│       │   └── context-engine.ts    # Explainable delay reason synthesizer
│       └── types/                   # Train, Station, and Rail types
│
├── data/                            # Raw GIS assets, GeoJSONs, stations.json, speed CSVs
└── package.json                     # Root monorepo scripts & workspaces
```

---

## 3. Database Abstraction Layer (`DB_TYPE`)

The server includes a pluggable storage engine supporting 4 backends configured through the `DB_TYPE` environment variable:

```bash
DB_TYPE=memory | mongodb | postgres | sqlite
```

### Unified `IDatabase` Interface

```typescript
export interface IDatabase {
  readonly dbType: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Users & Authentication
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;

  // Train Kinematics & States
  getAllTrains(): Promise<TrainState[]>;
  getTrainByNo(trainNo: string): Promise<TrainState | null>;
  upsertTrain(train: TrainState): Promise<TrainState>;
  resetTrains(initialTrains: TrainState[]): Promise<TrainState[]>;

  // Railway Stations
  getAllStations(filter?: StationFilter): Promise<Station[]>;
  getStationByCode(code: string): Promise<Station | null>;

  // Spatial Telemetry Audit Logs
  logTelemetry(telemetry: Omit<TelemetryLog, 'id'>): Promise<TelemetryLog>;
  getTelemetryHistory(trainNo: string, limit?: number): Promise<TelemetryLog[]>;
}
```

### Supported Adapters:
1. **`memory` (Default)**: Zero-setup, instant startup. Seeded with 2 default users, demo trains (12393 Sampark Kranti, 12301 Rajdhani Express), and Indian Railway stations.
2. **`mongodb`**: Powered by **Mongoose**. Connects to `MONGODB_URI` with persistent collections (`users`, `trains`, `stations`, `telemetries`). Includes automatic graceful fallback to in-memory mode if MongoDB server is offline.
3. **`sqlite`**: Relational database storage with transactional updates and serialized state snapshots.
4. **`postgres`**: Relational schema supporting JSONB kinematics columns and indexing.

---

## 4. REST API Documentation

### Authentication (`/api/auth`)

#### 1. Register User
* **Endpoint**: `POST /api/auth/register`
* **Request Body**:
  ```json
  {
    "email": "railfan@trackpulse.in",
    "password": "trackpulse123",
    "name": "TrackPulse Railfan",
    "role": "railfan"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "message": "User registered successfully",
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "usr_railfan_01",
      "email": "railfan@trackpulse.in",
      "name": "TrackPulse Railfan",
      "role": "railfan",
      "createdAt": "2026-09-20T12:00:00.000Z"
    }
  }
  ```

#### 2. Login
* **Endpoint**: `POST /api/auth/login`
* **Request Body**:
  ```json
  {
    "email": "railfan@trackpulse.in",
    "password": "trackpulse123"
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "message": "Login successful",
    "token": "<JWT_TOKEN>",
    "user": { ... }
  }
  ```

#### 3. Current User Profile
* **Endpoint**: `GET /api/auth/me`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response `200 OK`**: Returns user profile payload.

---

### Trains & Kinematics (`/api/trains`)

#### 1. List Active Trains
* **Endpoint**: `GET /api/trains`
* **Response `200 OK`**: Returns array of all active train states (lat/lng, snapped position, loop line flag, delay reasoning, speed profile).

#### 2. Get Train by Train Number
* **Endpoint**: `GET /api/trains/:trainNo`
* **Response `200 OK`**: Returns train details for the requested train (e.g., `12393`).

#### 3. Ingest GPS Telemetry
* **Endpoint**: `POST /api/trains/:trainNo/telemetry`
* **Request Body**:
  ```json
  {
    "lat": 27.2063,
    "lng": 78.2411,
    "speed": 0,
    "heading": 105,
    "accuracy": 8
  }
  ```
* **Processing Pipeline**:
  1. Kalman Filter smooths GPS jitter.
  2. Turf.js rail-snapper projects coordinate onto track centerline and calculates lateral offset.
  3. Loop-detector evaluates lateral offset (>18m) and speed (<5 km/h) for siding detours.
  4. Overtake predictor checks closing speed from trailing trains.
  5. Context engine synthesizes explainable delay reason cards.
  6. Broadcasts `train:state` event over Socket.io to all connected browsers.

#### 4. Trigger Live Rajdhani Overtake Simulation
* **Endpoint**: `POST /api/trains/simulate/overtake`
* **Sequence Steps**:
  * **Step 1**: 12301 Howrah Rajdhani closes to 4 km behind 12393 Sampark Kranti at 118 km/h.
  * **Step 2**: 12301 overtakes on Tundla mainline at 124 km/h while 12393 is held on Loop 1.
  * **Step 3**: 12393 receives mainline clearance and accelerates back to 88 km/h.

#### 5. Reset Simulation
* **Endpoint**: `POST /api/trains/simulate/reset`
* **Response `200 OK`**: Restores trains to baseline configuration.

---

### Stations, Zones, and Tracks (`/api/stations`, `/api/zones`, `/api/tracks`)

* `GET /api/stations?search=tundla&zone=NCR` — Search Indian Railway stations database.
* `GET /api/stations/:code` — Retrieve station details by IR station code.
* `GET /api/zones` — List all 17 railway zones with metadata and brand colors.
* `GET /api/zones/geojson` — Returns GeoJSON polygons for IR zones.
* `GET /api/tracks` — Track classification, speed limits, and usage hierarchy.
* `GET /api/tracks/geojson` — Returns track GeoJSON with permissible speed properties.
* `GET /api/tracks/speeds` — Returns speed badges FeatureCollection.
* `GET /api/health` — Service health check, database type, and uptime metrics.

---

## 5. WebSockets & Real-Time Sync (Socket.io)

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `train:all` | Server $\rightarrow$ Client | `TrainState[]` | Sent immediately on socket handshake. |
| `train:state` | Server $\rightarrow$ Client | `TrainState` | Broadcast whenever train telemetry updates. |
| `train:subscribe` | Client $\rightarrow$ Server | `trainNo: string` | Joins room `train:${trainNo}` for targeted updates. |
| `gps:report` | Client $\rightarrow$ Server | `GPSReport` | Ingests crowdsourced passenger telemetry. |
| `simulation:trigger`| Client $\rightarrow$ Server | None | Advances overtake simulation step. |
| `simulation:step` | Server $\rightarrow$ Client | `{ step, message }`| Notifies clients of simulation progression. |
| `simulation:reset` | Server $\rightarrow$ Client | `{ message }` | Notifies clients of simulation reset. |

---

## 6. Spatial Layer Preservation (IRI Replica)

The Vite client (`apps/client/src/components/map/MapView.tsx`) fully preserves all spatial rendering layers:

1. **Zone Fills (`zones-fill`)**: 17 Indian Railway zone polygons with pastel fills (`NR`, `NCR`, `CR`, `WR`, `SCR`, `SR`, `ER`, `ECR`, `NER`, `NFR`, `SECR`, `SWR`, `WCR`, `ECoR`, `NWR`, `SER`, `KR`).
2. **Zone Outlines & Labels (`zones-outline`, `zones-label`)**: Dashed zone borders with centered abbreviations.
3. **Mainline Tracks (`tracks-main`, `tracks-main-glow`)**: High-speed tracks rendered in emerald green (`#22C55E`) with glowing underlay.
4. **Branch Lines (`tracks-branch`)**: Blue (`#4DA8FF`) intermediate lines.
5. **Loop Sidings & Yards (`tracks-siding`, `tracks-yard`)**: Dashed orange lines (`#FB923C`) for loops and gray (`#9CA3AF`) for yard leads.
6. **Permissible Speed Labels & Badges (`speed-labels`, `.speed-badge`)**: Text labels along lines and interactive rounded pills color-coded by permissible speed:
   * **$\ge$ 130 km/h**: Green pill (`#DCFCE7` / `#166534`)
   * **$\ge$ 110 km/h**: Blue pill (`#E0F2FE` / `#075985`)
   * **$\ge$ 100 km/h**: Yellow pill (`#FEF9C3` / `#854D0E`)
   * **$\le$ 30 km/h**: Orange siding pill (`#FFEDD5` / `#9A3412`)
7. **Station Markers**: Diamond markers with hover tooltip showing station code, name, and zone.
8. **Live Train Indicators**: Directional train vectors rotated to heading angle, animated pulsing rings on selected train, and loop siding hold badge.
9. **Layer Control Panel**: Real-time layer visibility toggles and 17-zone color legend.

---

## 7. Running the Application

### Prerequisites
* Node.js version 18+ (verified on Node v22)
* npm version 9+

### Build Both Applications

```bash
# From repository root
npm run build
```
This runs `npm run build:server` (TypeScript compilation into `apps/server/dist`) and `npm run build:client` (Vite production build into `apps/client/dist`).

### Run the Server

```bash
# Option A: In-memory mode (default, zero configuration)
npm run start:server

# Option B: MongoDB mode
DB_TYPE=mongodb MONGODB_URI=mongodb://localhost:27017/railtrack npm run start:server

# Option C: Development mode with hot reload
npm run dev:server
```
The server listens on `http://0.0.0.0:4000`.

### Run the Client

```bash
npm run dev:client
```
The client starts on `http://0.0.0.0:3000` with automated proxying to the Express backend for `/api` and `/socket.io`.

---

## 8. Verification & Test Checklist

- [x] Client builds with Vite + TypeScript (`apps/client/dist` created).
- [x] Server builds with TypeScript (`apps/server/dist` created).
- [x] `/api/health` reports status `ok` and active database type.
- [x] `/api/auth/login` and `/api/auth/register` generate valid JWT tokens.
- [x] `/api/trains` and `/api/stations` deliver spatial railway data.
- [x] `/api/zones` and `/api/zones/geojson` deliver IRI zone boundaries.
- [x] `/api/tracks` and `/api/tracks/geojson` deliver track network with speeds.
- [x] Overtake simulation endpoints (`/api/trains/simulate/overtake` and `reset`) cycle correctly.
- [x] Socket.io real-time connection and telemetry event broadcasting operational.
