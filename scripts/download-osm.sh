#!/bin/bash
# Download India OSM extract and filter rail
set -e

mkdir -p data/raw data/geojson

echo "Downloading India OSM PBF..."
wget -O data/raw/india-latest.osm.pbf https://download.geofabrik.de/asia/india-latest.osm.pbf

echo "Filtering rail tags..."
osmium tags-filter data/raw/india-latest.osm.pbf \
  nwr/railway \
  nwr/public_transport=station \
  -o data/raw/india-rail.osm.pbf

echo "Exporting tracks GeoJSON..."
ogr2ogr -f GeoJSON data/geojson/tracks.osm.geojson \
  data/raw/india-rail.osm.pbf lines \
  -where "railway IS NOT NULL"

echo "Done. Now run: node scripts/patch-speeds.js"
echo "And: tippecanoe -o data/tiles/india-rail.pmtiles -Z4 -z14 --drop-densest-as-needed data/geojson/tracks-with-speed.geojson data/geojson/stations.geojson"
