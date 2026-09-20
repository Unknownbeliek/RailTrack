/** Geographic helpers. Coordinates are [lng, lat]. */

export type LngLat = [number, number];

const R_KM = 6371;

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingDeg(a: LngLat, b: LngLat): number {
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export interface PolylineIndex {
  coords: LngLat[];
  cumKm: number[];
  lengthKm: number;
}

export function indexPolyline(coords: LngLat[]): PolylineIndex {
  const cumKm = [0];
  for (let i = 1; i < coords.length; i++) {
    cumKm.push(cumKm[i - 1] + haversineKm(coords[i - 1], coords[i]));
  }
  return { coords, cumKm, lengthKm: cumKm[cumKm.length - 1] || 0 };
}

export function alongPolyline(index: PolylineIndex, distKm: number): { coord: LngLat; heading: number } {
  const { coords, cumKm, lengthKm } = index;
  if (coords.length === 0) return { coord: [0, 0], heading: 90 };
  if (coords.length === 1) return { coord: coords[0], heading: 90 };

  const d = Math.max(0, Math.min(lengthKm, distKm));
  let i = 0;
  while (i < cumKm.length - 1 && cumKm[i + 1] < d) i++;

  const span = cumKm[i + 1] - cumKm[i] || 1e-6;
  const t = (d - cumKm[i]) / span;
  const a = coords[i];
  const b = coords[Math.min(i + 1, coords.length - 1)];
  const coord: LngLat = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  const look = Math.min(lengthKm, d + Math.max(0.4, lengthKm * 0.002));
  let j = i;
  while (j < cumKm.length - 1 && cumKm[j + 1] < look) j++;
  const span2 = cumKm[j + 1] - cumKm[j] || 1e-6;
  const t2 = (look - cumKm[j]) / span2;
  const a2 = coords[j];
  const b2 = coords[Math.min(j + 1, coords.length - 1)];
  const ahead: LngLat = [a2[0] + (b2[0] - a2[0]) * t2, a2[1] + (b2[1] - a2[1]) * t2];

  return { coord, heading: bearingDeg(coord, ahead) };
}

export function offsetLngLat(coord: LngLat, headingDeg: number, meters: number): LngLat {
  const heading = toRad(headingDeg + 90);
  const dLat = (meters / 1000 / R_KM) * Math.cos(heading);
  const dLng = (meters / 1000 / (R_KM * Math.cos(toRad(coord[1])))) * Math.sin(heading);
  return [coord[0] + toDeg(dLng), coord[1] + toDeg(dLat)];
}

export function lerpLngLat(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export interface ConsistCar {
  lng: number;
  lat: number;
  heading: number;
  role: 'loco' | 'coach' | 'tail';
}

/** Sample a rake along the polyline so the body follows curves instead of staying a straight sprite. */
export function sampleConsist(
  index: PolylineIndex,
  headKm: number,
  direction: 1 | -1,
  carCount: number,
  carLengthKm: number
): ConsistCar[] {
  const cars: ConsistCar[] = [];
  const n = Math.max(2, carCount);
  for (let i = 0; i < n; i++) {
    const km = headKm - direction * i * carLengthKm;
    const along = alongPolyline(index, km);
    let heading = along.heading;
    if (direction === -1) heading = (heading + 180) % 360;
    const role: ConsistCar['role'] = i === 0 ? 'loco' : i === n - 1 ? 'tail' : 'coach';
    cars.push({ lng: along.coord[0], lat: along.coord[1], heading, role });
  }
  return cars;
}
