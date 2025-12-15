// nonAr.js - Non-AR viewing mode with orbit controls and gyro support

let scene, camera, renderer, carpet;
let orbitControls, gyroControls;
let isGyroEnabled = false;

/**
 * Initialize the non-AR viewing mode
 */
function initNonArMode() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);
  
  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(2, 2, 2);
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  
  // Load carpet model
  loadCarpetModel();
  
  // Setup controls
  setupOrbitControls();
  setupGyroControls();
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Start animation loop
  animate();
}

/**
 * Setup orbit controls with mouse and touch support
 * Includes wheel zoom and pinch-to-zoom functionality
 */
function setupOrbitControls() {
  orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.05;
  orbitControls.autoRotate = false;
  orbitControls.enableZoom = true;
  
  // Zoom parameters
  const zoomConfig = {
    speed: 0.1,
    minRadius: 0.5,
    maxRadius: 5,
    currentRadius: camera.position.length()
  };
  
  // Mouse wheel zoom listener
  renderer.domElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    
    const direction = event.deltaY > 0 ? 1 : -1;
    const zoomDelta = direction * zoomConfig.speed;
    
    // Calculate new radius
    let newRadius = zoomConfig.currentRadius + zoomDelta;
    newRadius = Math.max(zoomConfig.minRadius, Math.min(zoomConfig.maxRadius, newRadius));
    
    // Update camera position maintaining direction
    const direction3D = camera.position.clone().normalize();
    camera.position.copy(direction3D.multiplyScalar(newRadius));
    
    zoomConfig.currentRadius = newRadius;
    orbitControls.target.copy(scene.position);
    orbitControls.update();
  }, { passive: false });
  
  // Touch pinch-to-zoom listeners
  let touchStartDistance = 0;
  const pinchZoomConfig = {
    delta: 0.005,
    minRadius: 0.5,
    maxRadius: 5
  };
  
  renderer.domElement.addEventListener('touchstart', (event) => {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      touchStartDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
    }
  }, false);
  
  renderer.domElement.addEventListener('touchmove', (event) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const distanceDelta = touchStartDistance - currentDistance;
      const zoomDelta = distanceDelta * pinchZoomConfig.delta;
      
      // Calculate new radius
      let newRadius = zoomConfig.currentRadius + zoomDelta;
      newRadius = Math.max(pinchZoomConfig.minRadius, Math.min(pinchZoomConfig.maxRadius, newRadius));
      
      // Update camera position maintaining direction
      const direction3D = camera.position.clone().normalize();
      camera.position.copy(direction3D.multiplyScalar(newRadius));
      
      zoomConfig.currentRadius = newRadius;
      orbitControls.target.copy(scene.position);
      orbitControls.update();
      
      touchStartDistance = currentDistance;
    }
  }, { passive: false });
  
  renderer.domElement.addEventListener('touchend', (event) => {
    if (event.touches.length < 2) {
      touchStartDistance = 0;
    }
  }, false);
}

/**
 * Setup gyroscope controls for mobile device orientation
 */
function setupGyroControls() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ requires permission request
    const permissionButton = document.createElement('button');
    permissionButton.textContent = 'Enable Gyro Controls';
    permissionButton.style.position = 'fixed';
    permissionButton.style.top = '10px';
    permissionButton.style.right = '10px';
    permissionButton.style.zIndex = '1000';
    permissionButton.style.padding = '10px 20px';
    permissionButton.style.backgroundColor = '#4CAF50';
    permissionButton.style.color = 'white';
    permissionButton.style.border = 'none';
    permissionButton.style.borderRadius = '4px';
    permissionButton.style.cursor = 'pointer';
    
    permissionButton.addEventListener('click', () => {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            isGyroEnabled = true;
            permissionButton.remove();
            window.addEventListener('deviceorientation', onDeviceOrientation);
          }
        })
        .catch(console.error);
    });
    
    document.body.appendChild(permissionButton);
  } else if (typeof DeviceOrientationEvent !== 'undefined') {
    // Non-iOS devices
    isGyroEnabled = true;
    window.addEventListener('deviceorientation', onDeviceOrientation);
  }
  
  gyroControls = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    enabled: false
  };
}

/**
 * Handle device orientation events for gyro controls
 */
function onDeviceOrientation(event) {
  if (!isGyroEnabled || !gyroControls.enabled) return;
  
  gyroControls.alpha = THREE.MathUtils.degToRad(event.alpha);
  gyroControls.beta = THREE.MathUtils.degToRad(event.beta);
  gyroControls.gamma = THREE.MathUtils.degToRad(event.gamma);
  
  // Apply rotation based on device orientation
  const euler = new THREE.Euler(gyroControls.beta, gyroControls.alpha, -gyroControls.gamma, 'YXZ');
  const quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(euler);
  
  // Update camera rotation while maintaining distance
  const distance = camera.position.length();
  const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
  camera.position.copy(direction.multiplyScalar(distance));
  camera.lookAt(scene.position);
}

/**
 * Load the carpet 3D model
 */
function loadCarpetModel() {
  // Placeholder for carpet model loading
  // Replace with actual model loader (GLTFLoader, OBJLoader, etc.)
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  carpet = new THREE.Mesh(geometry, material);
  carpet.receiveShadow = true;
  scene.add(carpet);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);
}

/**
 * Handle window resize
 */
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

/**
 * Animation loop
 */
function animate() {
  requestAnimationFrame(animate);
  
  if (orbitControls) {
    orbitControls.update();
  }
  
  renderer.render(scene, camera);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initNonArMode);
