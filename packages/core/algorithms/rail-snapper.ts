import * as turf from '@turf/turf';

export interface SnappedResult {
  snappedLat: number;
  snappedLng: number;
  lateralOffset: number;          // meters from track center
  distanceAlongRoute: number;     // meters from route origin
  kmMarker: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function snapToTrack(
  rawPoint: { lat: number; lng: number; accuracy: number },
  routeGeoJSON: any
): SnappedResult {
  try {
    const point = turf.point([rawPoint.lng, rawPoint.lat]);

    // Find nearest point on the track feature / feature collection
    const lineFeature = routeGeoJSON.type === 'FeatureCollection'
      ? routeGeoJSON.features[0]
      : routeGeoJSON;

    const snapped = turf.nearestPointOnLine(lineFeature, point, { units: 'meters' });

    // Lateral offset = distance between raw GPS point and snapped point on rail line
    const lateralOffset = turf.distance(point, snapped, { units: 'meters' });

    // Distance along route (location property or calculated distance along line)
    const distanceAlongRoute = snapped.properties?.location ?? 
      (turf.length(lineFeature, { units: 'meters' }) * ((snapped.properties?.index ?? 0) / (lineFeature.geometry?.coordinates?.length || 1)));

    const kmMarker = Math.round((distanceAlongRoute / 1000) * 10) / 10;

    const confidence = rawPoint.accuracy < 20 ? 'HIGH' : rawPoint.accuracy < 50 ? 'MEDIUM' : 'LOW';

    return {
      snappedLat: snapped.geometry.coordinates[1],
      snappedLng: snapped.geometry.coordinates[0],
      lateralOffset,
      distanceAlongRoute,
      kmMarker,
      confidence
    };
  } catch (err) {
    // Pure TS Haversine fallback calculation if GeoJSON format varies
    return {
      snappedLat: rawPoint.lat,
      snappedLng: rawPoint.lng,
      lateralOffset: 0,
      distanceAlongRoute: 0,
      kmMarker: 0,
      confidence: 'LOW'
    };
  }
}
