# TrackPulse Data Layers

This directory implements the IRI-style 3-layer rail map:

1. **Zone fills** (NR/CR/WR pastel)
2. **Track lines** (main/branch/siding)
3. **Permissible speeds** (110 kmph badges)

## Structure

```
data/
  geojson/
    zones-all.geojson           # 17 IR zones as polygons (hand-made once)
    zones/
      NR.geojson, NCR.geojson... # individual zone files (optional)
    tracks.geojson              # OSM-derived + curated main/branch/siding
    tracks-with-speed.geojson   # after patching with maxspeed-india.csv
    stations.geojson            # stations as Point FeatureCollection
    speed-badges.geojson        # midpoint badges for pill UI
    routes/
      12393_NDLS_RJPB.json      # demo route for simulation
  patches/
    maxspeed-india.csv          # curated WTT speeds (authoritative)
    track-fixes.csv             # geometry corrections
  styles/
    trackpulse-dark.json        # MapLibre style JSON (dark)
    trackpulse-light.json       # MapLibre style JSON (light)
  tiles/
    india-rail.pmtiles          # built for production CDN (future)
```

## Rebuilding

### 1. Track lines (OSM)
```bash
wget -O data/raw/india-latest.osm.pbf https://download.geofabrik.de/asia/india-latest.osm.pbf
osmium tags-filter data/raw/india-latest.osm.pbf nwr/railway nwr/public_transport=station -o data/raw/india-rail.osm.pbf
ogr2ogr -f GeoJSON data/geojson/tracks.geojson data/raw/india-rail.osm.pbf lines -where "railway IS NOT NULL"
```

### 2. Zones
Hand-drawn in geojson.io, merged to zones-all.geojson. Colors in `apps/web/lib/mapConstants.ts` -> `ZONE_COLORS`.

### 3. Speeds
```bash
node scripts/patch-speeds.js
# merges patches/maxspeed-india.csv -> tracks-with-speed.geojson + speed-badges.geojson
```

### 4. PMTiles (production)
```bash
tippecanoe -o data/tiles/india-rail.pmtiles -Z4 -z14 --drop-densest-as-needed data/geojson/tracks-with-speed.geojson data/geojson/stations.geojson
```

## Layer Order (IRI match)

Bottom → Top
1. Base map (Carto dark/light)
2. Zone fills (pastel 0.28-0.35)
3. Zone outlines (dashed)
4. Track mainline glow
5. Track mainline (green #22C55E)
6. Track branch (blue #4DA8FF)
7. Track siding/yard (orange dashed)
8. Speed labels (line symbols)
9. Speed pill badges (HTML markers at midpoints, zoom >=8)
10. Station dots + labels
11. Demo route (dashed blue)
12. Live trains (TrackPulse USP)
13. Overtake/loop highlights
14. UI overlays

## Sources

- OSM / OpenRailwayMap geometry (allowed)
- Own zone GeoJSON (hand-made)
- Curated speeds CSV (WTT + railfans)
- IRI only as visual reference (no scraping)
