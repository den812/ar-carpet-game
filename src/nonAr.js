import * as THREE from "three";
import { spawnCars } from "./cars/CarModels.js";
import { CONFIG, getCameraConfig, getCarpetConfig, getControlsConfig } from "./config.js";

export function startNonAR(mode) {
  const scene = new THREE.Scene();
  
  // Используем конфигурацию камеры
  const camConfig = getCameraConfig();
  const camera = new THREE.PerspectiveCamera(
    camConfig.fov,
    window.innerWidth / window.innerHeight,
    camConfig.near,
    camConfig.far
  );
  
  camera.position.set(camConfig.position.x, camConfig.position.y, camConfig.position.z);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // ИСПРАВЛЕНО: Ковер как 3D плоскость с правильным масштабом
  const carpetGeometry = new THREE.PlaneGeometry(2, 2.5); // Пропорции реального ковра
  const carpetTexture = new THREE.TextureLoader().load("./assets/carpet-scan.jpg");
  const carpetMaterial = new THREE.MeshBasicMaterial({ 
    map: carpetTexture,
    side: THREE.DoubleSide 
  });
  const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
  carpet.rotation.x = -Math.PI / 2; // Положить горизонтально
  scene.add(carpet);

  // Фон - градиент неба
  scene.background = new THREE.Color(0x87CEEB);

  // Освещение
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  // Spawn машинок
  spawnCars(scene);

  // Обработка изменения размера окна
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // РЕЖИМЫ УПРАВЛЕНИЯ
  if (mode === "GYRO") {
    setupGyroControls(camera);
  } else if (mode === "TOUCH") {
    setupTouchControls(camera, renderer.domElement);
  }

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

// Управление гироскопом
function setupGyroControls(camera) {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.beta && e.gamma) {
        // Наклоны телефона двигают камеру
        const beta = THREE.MathUtils.degToRad(e.beta || 0);
        const gamma = THREE.MathUtils.degToRad(e.gamma || 0);
        
        camera.position.x = Math.sin(gamma) * 2;
        camera.position.z = 1.8 + Math.sin(beta) * 0.5;
        camera.lookAt(0, 0, 0);
      }
    });
  }
}

// Управление пальцем (свайп)
function setupTouchControls(camera, canvas) {
  let lastTouchX = 0;
  let lastTouchY = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const deltaX = e.touches[0].clientX - lastTouchX;
    const deltaY = e.touches[0].clientY - lastTouchY;
    
    // Поворот камеры вокруг центра
    const angle = camera.userData.angle || 0;
    camera.userData.angle = angle + deltaX * 0.005;
    
    const radius = 2.5;
    camera.position.x = Math.sin(camera.userData.angle) * radius;
    camera.position.z = Math.cos(camera.userData.angle) * radius;
    camera.position.y = Math.max(0.5, Math.min(3, camera.position.y - deltaY * 0.01));
    camera.lookAt(0, 0, 0);
    
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  }, { passive: false });
}