import * as THREE from './imports/three.module.js';
  // Prevent the default context menu from appearing on right-click
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Disable the context menu (right-click)
  });
  let isGameStarted = false;
  // Function that handles the transition and game start
  function startGame() {
    if (isGameStarted) return; // Prevent multiple triggers
    isGameStarted = true;

    const gameTitleScreen = document.getElementById('gameTitleScreen');
    const speedDial = document.getElementById('speedDial');
    const sidebar = document.getElementById('sidebar');

    // Fade out title screen
    gameTitleScreen.style.opacity = '0';

    // Show UI elements (initially transparent)
    speedDial.style.display = 'grid';
    sidebar.style.display = 'flex';

    // Fade them in
    setTimeout(() => {
      speedDial.style.opacity = '1';
      sidebar.style.opacity = '1';
    }, 0);

    // Remove title screen after fade
    setTimeout(() => {
      gameTitleScreen.style.display = 'none';
    }, 500);
  }

  // Toggle visibility of the Car Picker UI
  function toggleCarPicker() {
    const carPicker = document.getElementById('carPicker');
    if (carPicker.style.display === 'none' || carPicker.style.display === '') {
      carPicker.style.display = 'flex'; // Show Car Picker
    } else {
      carPicker.style.display = 'none'; // Hide Car Picker
    }
  }

  window.onload = () => {
    document.getElementById('startButton').onclick = startGame;
    document.getElementById('toggleCarPickerBtn').addEventListener('click', toggleCarPicker);
  };

  let camera, scene, renderer;
  let block;
  let blockPosition = new THREE.Vector3(0, 0, 0);
  let blockRotation = new THREE.Vector3(0, 0, 0);
  let targetBlockRotation = new THREE.Vector3(0, 0, 0); // Target rotation for lerp
  let velocity = 0;
  let mph = 0;
  const maxSpeed = 2;

  let gearMode = "drive"; // Options: "drive", "reverse", "neutral"
  let gear = 0;

  let cameraOffsetZ = 5;
  let cameraOffsetX = 0;
  let targetCameraOffsetZ = cameraOffsetZ;
  let targetCameraOffsetX = cameraOffsetX;
  const cameraMoveDistance = 0.2;
  const cameraMoveSpeed = 0.025;

  let targetFov = 80;
  const maxFov = 90;
  const minFov = 70;
  const fovSpeed = 0.0003625;
  const fovBoostSpeed = 0.0003625;
  const keys = {};

  function createBlock(x, y, z, width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  function init() {
    camera = new THREE.PerspectiveCamera(targetFov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x80c7ff);

    const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xd9d9d9, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03125;
    scene.add(ground);

    const roadGeometry = new THREE.PlaneGeometry(16, 10000);
    const roadMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.03125;
    road.position.x = 0;
    scene.add(road);

    const lineGeometry = new THREE.BoxGeometry(0.0625, 10000, 0.1);
    const lineMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00});
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    const line2 = new THREE.Mesh(lineGeometry, lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.y = 0;
    line2.rotation.x = -Math.PI / 2;
    line2.position.y = 0;
    line.position.x = 0.125;
    line2.position.x = -0.125;
    scene.add(line, line2);

    // Side blocks
    createBlock(16, 3.00125, 0, 6, 6, 10000, 0x0000ff);
    createBlock(-16, 3.00125, 0, 6, 6, 10000, 0x0000ff);

    block = createBlock(0, 1.00125, 0, 2.25, 1.25, 4, 0xff00ff);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 5, 2);
    scene.add(light);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener("resize", onWindowResize);
    document.addEventListener("keydown", e => keys[e.code] = true);
    document.addEventListener("keyup", e => delete keys[e.code]);
  }

  function getAccelerationForSpeed(speed) {
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


  function getFovForSpeed(speed) {
    const fovMap = [
      { speed: 0.0, fov: 75 },
      { speed: 0.1, fov: 75.5 },
      { speed: 0.3, fov: 76 },
      { speed: 0.6, fov: 77 },
      { speed: 0.8, fov: 78 },
      { speed: 1.0, fov: 79 },
      { speed: 1.3, fov: 81 },
      { speed: 1.6, fov: 83 },
      { speed: 2.0, fov: 84 }
    ];
    const absSpeed = Math.abs(speed);

    if (absSpeed <= fovMap[0].speed) return fovMap[0].fov;
    if (absSpeed >= fovMap[fovMap.length - 1].speed) return fovMap[fovMap.length - 1].fov;

    for (let i = 0; i < fovMap.length - 1; i++) {
      const s1 = fovMap[i].speed;
      const s2 = fovMap[i + 1].speed;
      if (absSpeed >= s1 && absSpeed <= s2) {
        const f1 = fovMap[i].fov;
        const f2 = fovMap[i + 1].fov;
        const t = (absSpeed - s1) / (s2 - s1);
        return f1 + t * (f2 - f1);
      }
    }

    return 75;  // Default FOV value
  }

  function getFovForReversing(speed) {
    const reverseFovMap = [
      { speed: 0.0, fov: 75 },
      { speed: 0.1, fov: 75.5 },
      { speed: 0.3, fov: 76 },
    ];

    let absSpeed = Math.abs(speed);
    let closest = 0;
    for (const key of reverseFovMap.keys()) {
      if (absSpeed >= key) closest = key;
    }
    return reverseFovMap.get(closest);
  }

  function getRotationSpeedForSpeed(speed) {
    const rotationMap = [
      { speed: 0.00125, rotation: 0.0 },
      { speed: 0.05, rotation: 0.00650 },
      { speed: 0.1, rotation: 0.00825 },
      { speed: 0.2, rotation: 0.00850 },
      { speed: 0.3, rotation: 0.00875 },
      { speed: 0.4, rotation: 0.008875 },
      { speed: 0.5, rotation: 0.00875 },
      { speed: 0.6, rotation: 0.00850 },
      { speed: 0.7, rotation: 0.008375 },
      { speed: 0.8, rotation: 0.00825 },
      { speed: 0.9, rotation: 0.00800 },
      { speed: 1.0, rotation: 0.00750 },
      { speed: 1.2, rotation: 0.00650 },
      { speed: 1.4, rotation: 0.00525 },
      { speed: 1.6, rotation: 0.00425 },
      { speed: 1.8, rotation: 0.00400 }
    ];

    const absSpeed = Math.abs(speed);

    if (absSpeed <= rotationMap[0].speed) return rotationMap[0].rotation;
    if (absSpeed >= rotationMap[rotationMap.length - 1].speed) return rotationMap[rotationMap.length - 1].rotation;

    for (let i = 0; i < rotationMap.length - 1; i++) {
      const s1 = rotationMap[i].speed;
      const s2 = rotationMap[i + 1].speed;
      if (absSpeed >= s1 && absSpeed <= s2) {
        const r1 = rotationMap[i].rotation;
        const r2 = rotationMap[i + 1].rotation;
        const t = (absSpeed - s1) / (s2 - s1);
        return r1 + t * (r2 - r1);
      }
    }

    return 0.05;
  }

  // Define a map for braking intensity per speed
  function getBrakeForSpeed(speed) {
    const brakeMap = [
      { speed: 0.05, brake: 0.0016 },
      { speed: 0.1, brake: 0.0021 },
      { speed: 0.2, brake: 0.0023 },
      { speed: 0.4, brake: 0.0022 },
      { speed: 0.7, brake: 0.0021 },
      { speed: 1.1, brake: 0.0020 },
      { speed: 1.6, brake: 0.0019 },
      { speed: 1.8, brake: 0.0018 },
      { speed: 1.95, brake: 0.0016 }
    ];

    const absSpeed = Math.abs(speed);

    if (absSpeed <= brakeMap[0].speed) return brakeMap[0].brake;
    if (absSpeed >= brakeMap[brakeMap.length - 1].speed) return brakeMap[brakeMap.length - 1].brake;

    for (let i = 0; i < brakeMap.length - 1; i++) {
      const s1 = brakeMap[i].speed;
      const s2 = brakeMap[i + 1].speed;
      if (absSpeed >= s1 && absSpeed <= s2) {
        const b1 = brakeMap[i].brake;
        const b2 = brakeMap[i + 1].brake;
        const t = (absSpeed - s1) / (s2 - s1);
        return b1 + t * (b2 - b1);
      }
    }

    return 0.0010; // default brake value
  }

  function getMaxRollForSpeed(speed) {
    const rollMap = [
      { speed: 0.0, maxRoll: 0.0 },
      { speed: 0.3333, maxRoll: 0.4 },
      { speed: 0.6666, maxRoll: 0.8 },
      { speed: 1.0, maxRoll: 1.2 },
      { speed: 1.3333, maxRoll: 1.6 },
      { speed: 1.6666, maxRoll: 1.8 },
      { speed: 2.0, maxRoll: 2 },
    ];

    const absSpeed = Math.abs(speed);

    if (absSpeed <= rollMap[0].speed) return rollMap[0].maxRoll;
    if (absSpeed >= rollMap[rollMap.length - 1].speed) return rollMap[rollMap.length - 1].maxRoll;

    for (let i = 0; i < rollMap.length - 1; i++) {
      const s1 = rollMap[i].speed;
      const s2 = rollMap[i + 1].speed;
      if (absSpeed >= s1 && absSpeed <= s2) {
        const r1 = rollMap[i].maxRoll;
        const r2 = rollMap[i + 1].maxRoll;
        const t = (absSpeed - s1) / (s2 - s1);
        return r1 + t * (r2 - r1);
      }
    }

    return 0.0;
  }

  let rollAmount = 0;  // Actual roll applied (in degrees)
  let targetRollAmount = 0;  // Smoothed target roll
  let maxRoll = 0.5;  // Max roll limit in degrees (initialized to a default)

  let qPressedLastFrame = false;
  let ePressedLastFrame = false;
  let tiltForwardKeyHeld = false;
  let tiltTargetReached = false;
  let previousVelocity = 0;
  let tiltAmount = 0; // current tilt
  let tiltStrength = 0.025; // how fast tilt changes
  let maxTiltAngle = 1.5; // max degrees tilt forward/back

  function updateBlock() {
    const forward = keys["KeyW"];
    const backward = keys["KeyS"];
    const toggleReverseOn = keys["KeyQ"];
    const toggleReverseOff = keys["KeyE"];
    const left = keys["KeyA"];
    const right = keys["KeyD"];
    const tiltForward = keys["KeyT"];

    if (toggleReverseOn && !qPressedLastFrame) {
      if (gearMode === "drive") {
        gearMode = "neutral";
      } else if (gearMode === "neutral" && velocity <= 0) {
        gearMode = "reverse";
      }
    }

    if (toggleReverseOff && !ePressedLastFrame) {
      if (gearMode === "reverse") {
        gearMode = "neutral";
      } else if (gearMode === "neutral" && velocity >= 0) {
        gearMode = "drive";
      }
    }

    // Update key states
    qPressedLastFrame = toggleReverseOn;
    ePressedLastFrame = toggleReverseOff;

    // Input direction is always 1 when W is held
    let inputDir = forward ? 1 : 0;

    if (gearMode === "reverse") inputDir *= -1;
    if (gearMode === "neutral") inputDir = 0;

    // Apply movement logic
    if (inputDir !== 0 ) {
      if ((velocity >= 0.00125 && inputDir > 0) || (velocity <= -0.00125 && inputDir < 0) || velocity === 0) {
        const accel = getAccelerationForSpeed(velocity);
        velocity += accel * inputDir;
      }
    } else if (!((velocity >= 0.00125 && inputDir > 0) || (velocity <= -0.00125 && inputDir < 0) || velocity === 0) && inputDir === 0 && backward) {
      const brake = getBrakeForSpeed(velocity);
      velocity -= brake * Math.sign(velocity) * 2;
      if (Math.abs(velocity) < 0.00125) velocity = 0;
    } else if (!((velocity >= 0.00125 && inputDir > 0) || (velocity <= -0.00125 && inputDir < 0) || velocity === 0)) {
      const brake = getBrakeForSpeed(velocity);
      velocity -= brake * Math.sign(velocity) * 0.7;
      if (Math.abs(velocity) < 0.00125) velocity = 0;
    }
    if (gearMode === "reverse") {
      velocity = THREE.MathUtils.clamp(velocity, -0.2533, maxSpeed);
    } else if (gearMode === "drive") {
      velocity = THREE.MathUtils.clamp(velocity, 0, 2);
    } else {
      velocity = THREE.MathUtils.clamp(velocity, -maxSpeed, maxSpeed); // Still clamp in neutral
    }

    mph = Math.abs(velocity) * 51.5;
    // Update max roll based on the current speed
    maxRoll = getMaxRollForSpeed(velocity) * 0.8;

    // Get dynamic rotation speed based on the block's velocity
    let rotationSpeed = getRotationSpeedForSpeed(velocity);

    // Set target roll based on key input (A/D)
    if (keys["KeyA"]) {
      targetRollAmount = -maxRoll;
    } else if (keys["KeyD"]) {
      targetRollAmount = maxRoll;
    } else {
      targetRollAmount = 0; // Neutral when no input
    }

    // Smoothly interpolate the actual roll amount toward the target
    rollAmount = THREE.MathUtils.lerp(rollAmount, targetRollAmount, 0.1);
    targetBlockRotation.z = THREE.MathUtils.degToRad(rollAmount);

    // --- Calculate acceleration (change in velocity) ---
    let accelSpeed = Math.abs(velocity) - Math.abs(previousVelocity);

    // Determine target tilt angle based on acceleration
    let tiltDirection = 0;

    if (accelSpeed > 0.001) {
      // Accelerating
      tiltDirection = gearMode === "reverse" ? -1 : 1; // Flip in reverse
    } else if (accelSpeed < -0.001) {
      // Braking
      tiltDirection = gearMode === "reverse" ? 1 : -1; // Flip in reverse
    }

    // Calculate target tilt angle in radians
    let targetTiltRad = THREE.MathUtils.degToRad(tiltDirection * maxTiltAngle);

    // Smoothly lerp tiltAmount toward target tilt
    tiltAmount = THREE.MathUtils.lerp(tiltAmount, targetTiltRad, tiltStrength);

    // Apply tilt to block's X rotation (pitch)
    targetBlockRotation.x = tiltAmount;

    // Store current velocity for next frame's comparison
    previousVelocity = velocity;

    // Rotate the block based on A and D key input
    if (keys["KeyA"]) {
      if (velocity >= 0) {
        targetBlockRotation.y += rotationSpeed; // Rotate clockwise on A
      } else if (velocity <= 0) {
        targetBlockRotation.y -= rotationSpeed; // Rotate counterclockwise on A
      }
    }
    if (keys["KeyD"]) {
      if (velocity >= 0) {
        targetBlockRotation.y -= rotationSpeed; // Rotate counterclockwise on D
      } else if (velocity <= 0) {
        targetBlockRotation.y += rotationSpeed; // Rotate clockwise on D
      }
    }

    // Update position of the block based on its velocity
    const direction = new THREE.Vector3(0, 0, -1);  // Default forward direction
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetBlockRotation.y);  // Rotate direction based on current yaw
    direction.multiplyScalar(velocity);
    blockPosition.add(direction);

    // Calculate and apply FOV based on speed
    targetFov = getFovForSpeed(velocity);

    // Apply FOV to the camera
    camera.fov = targetFov;
    camera.updateProjectionMatrix();

    // Update speed display
    document.getElementById("speedDial").textContent = `Speed: ${velocity.toFixed(2)} (${mph.toFixed(0)} mph)`;
  }

  function animate() {
    requestAnimationFrame(animate);

    block.position.y = 1.125;

    // Apply lerp for smooth rotation
    blockRotation.lerp(targetBlockRotation, 0.1);

    block.position.lerp(blockPosition, 0.1);
    block.rotation.set(blockRotation.x, blockRotation.y, blockRotation.z);
    
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, fovSpeed);

    camera.updateProjectionMatrix();

    const offset = new THREE.Vector3(0, 3, 7.5);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), blockRotation.y);
    camera.position.copy(block.position).add(offset);
    camera.lookAt(block.position);

    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  init();
  animate();
  setInterval(updateBlock, 16);