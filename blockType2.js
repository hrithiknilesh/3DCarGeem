export function getAccelerationForSpeed(speed) {
    const accelMap = [
      { speed: 0.00125, accel: 0.0015 * 1.1, useLerp: true, gear: 1 },
      { speed: 0.06, accel: 0.0015 * 1.1, useLerp: true },
      { speed: 0.12, accel: 0.0022 * 1.1, useLerp: true },
  
      { speed: 0.24, accel: 0.0023 * 1.0, useLerp: false },  // Tweaked mph before
      { speed: 0.26, accel: 0.000030, useLerp: false },  // Tweaked mph
      { speed: 0.28, accel: 0.0023 * 1.0, useLerp: true, gear: 2 },  // Tweaked mph after
  
      { speed: 0.35, accel: 0.0025 * 1.0, useLerp: true },
  
      { speed: 0.47, accel: 0.0027 * 0.9, useLerp: false },  // Tweaked mph before
      { speed: 0.49, accel: 0.000038, useLerp: false },  // Tweaked mph
      { speed: 0.51, accel: 0.0027 * 0.9, useLerp: true, gear: 3 },  // Tweaked mph after
  
      { speed: 0.55, accel: 0.0024 * 0.9, useLerp: true },
  
      { speed: 0.82, accel: 0.0023 * 0.8, useLerp: false },  // Tweaked mph before
      { speed: 0.86, accel: 0.000032, useLerp: false },  // Tweaked mph
      { speed: 0.88, accel: 0.0023 * 0.8, useLerp: true, gear: 4 },  // Tweaked mph after
  
      { speed: 1.0, accel: 0.0021 * 0.8, useLerp: true },
  
      { speed: 1.25, accel: 0.0019 * 0.7, useLerp: false },  // Tweaked mph before
      { speed: 1.30, accel: 0.000028, useLerp: false },  // Tweaked mph
      { speed: 1.35, accel: 0.0019 * 0.7, useLerp: true, gear: 5 },  // Tweaked mph after
  
      { speed: 1.5, accel: 0.0017 * 0.7, useLerp: true },
      { speed: 1.65, accel: 0.0014 * 0.7, useLerp: true },
  
      { speed: 1.8, accel: 0.0006 * 0.7, useLerp: true },
      { speed: 1.95, accel: 0.0002 * 0.7, useLerp: true }
    ];
  
    const absSpeed = Math.abs(speed);
  
    if (absSpeed <= accelMap[0].speed) return accelMap[0].accel;
    if (absSpeed >= accelMap[accelMap.length - 1].speed) return accelMap[accelMap.length - 1].accel;
  
    for (let i = 0; i < accelMap.length - 1; i++) {
      const s1 = accelMap[i].speed;
      const s2 = accelMap[i + 1].speed;
      if (absSpeed >= s1 && absSpeed <= s2) {
        const a1 = accelMap[i].accel;
        const a2 = accelMap[i + 1].accel;
        const t = (absSpeed - s1) / (s2 - s1);
  
        if (accelMap[i].useLerp && accelMap[i + 1].useLerp) {
          // Apply lerp for tweaked values
          return a1 + t * (a2 - a1);
        } else {
          // If not tweaked, just return the current acceleration value without lerp
          return a1;
        }
      }
    }
  
    return 0.0007;
  }