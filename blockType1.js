export function getAccelerationForSpeed(speed) {
    const accelMap = [
      { speed: 0.00125, accel: 0.0016 * 1.0, useLerp: true, gear: 1 },
      { speed: 0.05, accel: 0.0016 * 1.0, useLerp: true },
      { speed: 0.1, accel: 0.0020* 1.0, useLerp: true },
  
      { speed: 0.2513, accel: 0.0025 * 0.9, useLerp: false },  // 13 mph before
      { speed: 0.2533, accel: 0.000035, useLerp: false },  // 13 mph
      { speed: 0.2553, accel: 0.0025 * 0.9, useLerp: true, gear: 2 },  // 13 mph after
  
      { speed: 0.3233, accel: 0.0026 * 0.9, useLerp: true },
  
      { speed: 0.4847, accel: 0.0028 * 0.8, useLerp: false },  // 26 mph before
      { speed: 0.4867, accel: 0.000040, useLerp: false },  // 26 mph
      { speed: 0.4887, accel: 0.0028 * 0.8, useLerp: true, gear: 3 },  // 26 mph after
  
      { speed: 0.5233, accel: 0.0026 * 0.8, useLerp: true },
  
      { speed: 0.8413, accel: 0.0025 * 0.7, useLerp: false },  // 40 mph before
      { speed: 0.8433, accel: 0.000035, useLerp: false },  // 40 mph
      { speed: 0.8453, accel: 0.0025 * 0.7, useLerp: true, gear: 4 },  // 40 mph after
  
      { speed: 0.9833, accel: 0.0023 * 0.7, useLerp: true },
  
      { speed: 1.2813, accel: 0.0021 * 0.6, useLerp: false },  // 61 mph before
      { speed: 1.2833, accel: 0.000030, useLerp: false },  // 61 mph
      { speed: 1.2853, accel: 0.0021 * 0.6, useLerp: true, gear: 5 },  // 61 mph after
  
      { speed: 1.45, accel: 0.0019 * 0.6, useLerp: true },
      { speed: 1.6, accel: 0.0016 * 0.6, useLerp: true },
  
      { speed: 1.75, accel: 0.0007 * 0.6, useLerp: true },
      { speed: 1.9, accel: 0.0003 * 0.6, useLerp: true }
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