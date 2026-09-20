export class TrainKalmanFilter {
  private lat: number | null = null;
  private lng: number | null = null;
  private speed: number = 0;
  private variance: number = 1000; // High initial uncertainty
  private lastTimestamp: number = 0;

  public update(measurement: { lat: number; lng: number; accuracy: number; timestamp: number }): {
    lat: number;
    lng: number;
    speed: number;
    uncertainty: number;
  } {
    if (this.lat === null || this.lng === null) {
      this.lat = measurement.lat;
      this.lng = measurement.lng;
      this.variance = Math.max(1, measurement.accuracy * measurement.accuracy);
      this.lastTimestamp = measurement.timestamp;
      return {
        lat: this.lat,
        lng: this.lng,
        speed: 0,
        uncertainty: Math.sqrt(this.variance)
      };
    }

    // Outlier check (reject teleporting GPS points)
    if (this.isOutlier(measurement)) {
      return {
        lat: this.lat,
        lng: this.lng,
        speed: this.speed,
        uncertainty: Math.sqrt(this.variance)
      };
    }

    const timeDeltaSec = Math.max(0.1, (measurement.timestamp - this.lastTimestamp) / 1000);
    const measurementVariance = Math.max(1, measurement.accuracy * measurement.accuracy);

    // Process noise added over time
    this.variance += timeDeltaSec * 2.0;

    // Kalman gain
    const kalmanGain = this.variance / (this.variance + measurementVariance);

    // Update estimates
    this.lat += kalmanGain * (measurement.lat - this.lat);
    this.lng += kalmanGain * (measurement.lng - this.lng);
    this.variance *= (1 - kalmanGain);

    // Derive speed (km/h) from position delta
    const distMeters = haversineDistance(this.lat, this.lng, measurement.lat, measurement.lng);
    const speedKmh = (distMeters / timeDeltaSec) * 3.6;
    
    // Low-pass filter for smooth speed readout
    this.speed = Math.round((this.speed * 0.4 + speedKmh * 0.6) * 10) / 10;
    this.lastTimestamp = measurement.timestamp;

    return {
      lat: this.lat,
      lng: this.lng,
      speed: Math.min(160, Math.max(0, this.speed)),
      uncertainty: Math.sqrt(this.variance)
    };
  }

  public isOutlier(measurement: { lat: number; lng: number; timestamp: number }): boolean {
    if (!this.lat || !this.lng || !this.lastTimestamp) return false;
    const distMeters = haversineDistance(this.lat, this.lng, measurement.lat, measurement.lng);
    const timeDeltaSec = Math.max(0.1, (measurement.timestamp - this.lastTimestamp) / 1000);
    const impliedSpeedKmh = (distMeters / timeDeltaSec) * 3.6;
    return impliedSpeedKmh > 200; // No Indian train goes >200 km/h
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
