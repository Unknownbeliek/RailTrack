# RailTrack

RailTrack is an Indian railway intelligence platform that goes beyond simple train tracking. It is designed to answer not only where a train is, but why it is delayed, how long the delay may persist, which trains are nearby, and what is likely to happen next on the route.

The product direction is inspired by the idea of a Flightradar24-style live map for Indian Railways, with route context, delay reasoning, overtake prediction, and railfan-focused views layered on top of a clean dashboard.

## Product Vision

Most railway apps tell users that a train is late. RailTrack aims to show the context behind the delay:

- Whether the train is stopped for a priority overtake
- Whether it is being looped at a station
- Whether weather, congestion, or infrastructure is affecting the section
- Which trains are ahead or behind and how they affect the current journey
- Whether the delay is likely to recover or grow further

This is the core product thesis: do not just track, understand.

## Core Experience

### Live Map

- Full-screen rail map with live train markers
- Search for trains, stations, or lines
- Delay-aware and class-aware marker modes
- Passenger and railfan density modes
- Station and track overlays with route geometry

### Train Intelligence

- Delay context cards with reason summaries
- Nearby trains radar
- Speed history and route analytics
- Overtake and loop prediction logic
- Selected-train follow mode

### Shared and Family Use Cases

- Quick arrival-time understanding for families waiting at stations
- Simple status views for regular passengers
- Advanced map density and route context for railfans
- Shareable live journey tracking as a future product direction

## What the Interface Currently Prioritizes

The current UI is intentionally light-first, matching the reference direction supplied for the redesign.

- White dashboard shell by default
- Dark mode toggle available in the top-right controls
- Large search bar centered in the main header rail
- Summary cards on the left and session controls on the right
- Bottom sheet details for selected trains

## Feature Scope

### Current Platform Capabilities

- Live train map with MapLibre
- Train search and selection
- Track and station GeoJSON rendering
- Bottom-sheet train detail cards
- Nearby trains view
- Speed and context panels
- Auth modal and user session handling
- Light and dark theme support

### Product Direction From the PRD

- Delay reason prediction
- Overtake prediction
- Loop station prediction
- Weather-aware delay inference
- Delay propagation forecasting
- Multilingual support
- Journey sharing
- Push notifications
- Railfan mode with advanced telemetry

## Feasibility Summary

The product is feasible, but the intelligence layer needs a phased rollout.

### What Makes It Feasible

- India has enough smartphone penetration for crowdsourced GPS
- Railway data can be partially assembled from public, scraped, and partner sources
- Map-based train tracking is a proven user experience
- Railway modernization is improving the available telemetry surface

### Main Constraints

- No stable official public live-train API
- Between-station tracking remains hard without GPS crowdsource or inference
- Delay reasons are not published consistently
- Prediction accuracy depends on data quality and coverage
- Legal and partnership questions remain important

## System Architecture

RailTrack follows a layered architecture:

1. Client layer
2. API and routing layer
3. Application logic and simulation layer
4. Data and intelligence layer
5. Ingestion and background processing layer

### Current Repository Layout

- `client/` contains the Vite React dashboard
- `server/` contains the Express API, simulation engine, and data routes
- `packages/core/` contains shared rail algorithms and types
- `data/` contains route, station, and map source files

### Runtime Flow

1. The client boots the map dashboard and loads trains from the backend.
2. The server seeds or loads train and station data.
3. The map consumes train snapshots and GeoJSON track data.
4. The simulation engine updates trains continuously.
5. The UI reacts to selected trains, filter state, and theme state.

## Data Architecture

The platform is centered on a railway graph model.

### Core Data Domains

- Stations
- Trains and schedules
- Route geometry
- Speed restrictions
- Live positions
- Delay reasons
- Crowdsourced GPS contributions
- Journey history and user preferences

### Data Sources

- NTES-like schedule and status data
- Rail geometry from map and route assets
- Weather and fog inputs for inference
- Historical patterns for delay forecasting
- Crowdsource GPS for live position refinement

### Current Local Data Assets

- `data/geojson/tracks.geojson`
- `data/geojson/tracks-with-speed.geojson`
- `data/geojson/stations.geojson`
- `data/geojson/zones-all.geojson`
- `data/geojson/routes/`

## API Surface

The current server exposes the following important endpoints:

- `GET /api/health`
- `GET /api/trains`
- `GET /api/trains/:trainNo`
- `POST /api/trains/simulate/overtake`
- `POST /api/trains/simulate/reset`
- `GET /api/stations`
- `GET /api/stations/geojson`
- `GET /api/tracks`
- `GET /api/tracks/geojson`
- `GET /api/zones`

The client reads these through the Vite proxy during local development.

## UI and Design System Notes

The design direction follows a calm, high-contrast, information-dense product style.

### Design Principles

- Calm: generous whitespace and clear hierarchy
- Confidence: visible state, live status, and certainty cues
- Context: explain why a train is delayed, not only that it is delayed
- Delight: smooth motion and purposeful visual accents

### Visual Language

- White-first dashboard shell
- Deep text contrast for readability
- Rail-blue primary accents
- Delay and status colors for immediate scanning
- Rounded cards and soft shadows instead of hard chrome

## Development Roadmap

### Phase 0: Foundation

- Clean up route and station data
- Lock down the design system
- Keep the map and backend stable
- Finalize the seed data model

### Phase 1: MVP

- Live train map
- Train search and status view
- Delay context cards
- Nearby trains view
- Basic overtake and loop intelligence

### Phase 2: Intelligence

- Delay reason prediction
- ETA prediction
- Weather integration
- Better route analytics
- Push alerts and sharing

### Phase 3: Railfan and Growth

- Railfan mode
- Historical analytics
- Multilingual support
- Social and community features
- Public launch hardening

## Risk Summary

- Data quality risk: live intelligence is only as good as the inputs
- Legal risk: source access and scraping rules must be handled carefully
- Accuracy risk: predictions must be framed as probabilistic, not absolute
- Scalability risk: live updates and map rendering need to stay efficient
- Product risk: the app must remain useful for both passengers and railfans

## Local Development

Prerequisites:

- Node.js 18+
- npm 9+

Install dependencies:

```bash
npm install
```

Run the client:

```bash
npm run dev:client
```

Run the server:

```bash
npm run dev:server
```

### Notes

- The client defaults to the light theme.
- Use the theme toggle in the header to switch themes.
- The server must be running for live train data and map data to appear.

## Suggested Cleanup

- Rename remaining legacy `TrackPulse` identifiers in storage keys and auth labels if you want a complete product rename.
- Remove the old placeholder layout components under `client/src/components/layout/` once you confirm they are unused.
- Split the header into smaller reusable pieces if the dashboard continues to grow.

## License

MIT License.
