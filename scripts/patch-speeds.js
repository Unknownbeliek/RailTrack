const fs = require('fs');
const path = require('path');

const TRACKS_PATH = path.join(__dirname, '../data/geojson/tracks.geojson');
const PATCH_CSV_PATH = path.join(__dirname, '../data/patches/maxspeed-india.csv');
const OUTPUT_PATH = path.join(__dirname, '../data/geojson/tracks-with-speed.geojson');
const SPEED_BADGES_PATH = path.join(__dirname, '../data/geojson/speed-badges.geojson');

function parseCSV(csv) {
  const lines = csv.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    header.forEach((h, i) => obj[h] = cols[i] || '');
    return obj;
  });
}

function midpointOfLine(coords) {
  if (coords.length === 0) return [0, 0];
  const midIdx = Math.floor(coords.length / 2);
  if (coords.length % 2 === 1) return coords[midIdx];
  const a = coords[midIdx - 1];
  const b = coords[midIdx];
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function main() {
  console.log('Loading tracks:', TRACKS_PATH);
  const tracksRaw = fs.readFileSync(TRACKS_PATH, 'utf-8');
  const tracks = JSON.parse(tracksRaw);

  console.log('Loading patches:', PATCH_CSV_PATH);
  const csvRaw = fs.readFileSync(PATCH_CSV_PATH, 'utf-8');
  const patches = parseCSV(csvRaw);
  console.log(`Found ${patches.length} speed patches`);

  const patchMap = new Map();
  patches.forEach(p => {
    const key1 = `${p.from_station}-${p.to_station}`.toUpperCase();
    const key2 = p.section_name.toLowerCase();
    patchMap.set(key1, p);
    patchMap.set(key2, p);
  });

  let patchedCount = 0;
  tracks.features.forEach(feat => {
    const id = (feat.properties.id || '').toUpperCase();
    const name = (feat.properties.name || '').toLowerCase();
    const section = (feat.properties.section || '').toLowerCase();

    let matched;
    for (const p of patches) {
      const fromTo = `${p.from_station}-${p.to_station}`.toLowerCase();
      if (id.includes(p.from_station) && id.includes(p.to_station)) { matched = p; break; }
      if (name.includes(fromTo.replace('-', ' - ')) || name.includes(p.section_name.toLowerCase())) { matched = p; break; }
      if (section && p.section_name.toLowerCase().includes(section)) { matched = p; break; }
    }

    if (!matched) {
      if (patchMap.has(id)) matched = patchMap.get(id);
    }

    if (matched) {
      feat.properties.maxspeed = matched.max_speed_kmph;
      feat.properties['maxspeed:railway'] = matched.max_speed_kmph;
      feat.properties.speed_source = `${matched.source} ${matched.updated}`;
      feat.properties.speed_patch_from = matched.from_station;
      feat.properties.speed_patch_to = matched.to_station;
      patchedCount++;
    } else {
      if (!feat.properties.maxspeed) {
        if (feat.properties.usage === 'main') feat.properties.maxspeed = '110';
        else if (feat.properties.usage === 'branch') feat.properties.maxspeed = '100';
        else if (feat.properties.service === 'siding' || feat.properties.service === 'yard') feat.properties.maxspeed = '30';
      }
    }
  });

  console.log(`Patched ${patchedCount} tracks with CSV speeds`);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(tracks, null, 2));
  console.log('Wrote', OUTPUT_PATH);

  const badges = {
    type: 'FeatureCollection',
    features: tracks.features
      .filter(f => f.properties.maxspeed && !f.properties.service)
      .map(f => {
        const mid = midpointOfLine(f.geometry.coordinates);
        return {
          type: 'Feature',
          properties: {
            maxspeed: f.properties.maxspeed,
            section: f.properties.section || f.properties.id,
            name: f.properties.name,
            zone: f.properties.zone,
            usage: f.properties.usage
          },
          geometry: {
            type: 'Point',
            coordinates: mid
          }
        };
      })
  };

  fs.writeFileSync(SPEED_BADGES_PATH, JSON.stringify(badges, null, 2));
  console.log('Wrote speed badges', SPEED_BADGES_PATH, `(${badges.features.length} badges)`);
}

main();
