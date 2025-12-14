import * as THREE from "three";
//import { spawnCars } from "./CarModels.js";
import { CONFIG, getCameraConfig, getCarpetConfig, getControlsConfig } from "../config.js";

// Именованный экспорт массива моделей
export const CarModels = [
    {
        name: 'Buggy',
        url: './assets/models/Buggy.glb',
        scale: 0.001 // Подберите масштаб опытным путем
    },
    {
        name: 'Milk Truck',
        url: './assets/models/CesiumMilkTruck.glb',
        scale: 0.025
    },
    {
        name: 'Duck',
        url: './assets/models/Duck.glb',
        scale: 0.05
    }
];

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
  const carpetConfig = getCarpetConfig();
  const carpetGeometry = new THREE.PlaneGeometry(carpetConfig.width, carpetConfig.height);
  const carpetTexture = new THREE.TextureLoader().load("./assets/carpet-scan.jpg");
  const carpetMaterial = new THREE.MeshBasicMaterial({ 
    map: carpetTexture,
    side: THREE.DoubleSide 
  });
  const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
  carpet.rotation.x = -Math.PI / 2; // Положить горизонтально
  carpet.position.y = carpetConfig.y;
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
  const controlsConfig = getControlsConfig();
  
  if (mode === "GYRO" && controlsConfig.gyro.enabled) {
    setupGyroControls(camera);
  } else if (mode === "TOUCH" && controlsConfig.touch.enabled) {
    setupTouchControls(camera, renderer.domElement);
  }
  
  // УПРАВЛЕНИЕ МЫШКОЙ (всегда активно на ПК)
  if (controlsConfig.mouse.enabled) {
    setupMouseControls(camera, renderer.domElement);
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
    camera.userData.angle = angle + deltaX * CONFIG.controls.touch.sensitivity;
    
    const radius = 2.5;
    camera.position.x = Math.sin(camera.userData.angle) * radius;
    camera.position.z = Math.cos(camera.userData.angle) * radius;
    camera.position.y = Math.max(0.5, Math.min(3, camera.position.y - deltaY * 0.01));
    camera.lookAt(0, 0, 0);
    
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  }, { passive: false });
}

// 🖱️ УПРАВЛЕНИЕ МЫШКОЙ (новое!)
function setupMouseControls(camera, canvas) {
  const config = CONFIG.controls.mouse;
  
  let isDragging = false;
  let previousMouseX = 0;
  let previousMouseY = 0;
  
  // Инициализация угла и расстояния
  if (!camera.userData.angle) {
    camera.userData.angle = Math.atan2(camera.position.x, camera.position.z);
  }
  if (!camera.userData.distance) {
    camera.userData.distance = Math.sqrt(
      camera.position.x ** 2 + 
      camera.position.z ** 2
    );
  }
  
  // Нажатие мыши
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });
  
  // Отпускание мыши
  window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
  });
  
  // Движение мыши
  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;
    
    // Вращение вокруг центра (левая/правая кнопка)
    camera.userData.angle -= deltaX * config.rotateSpeed;
    
    // Изменение высоты (вверх/вниз)
    camera.position.y = Math.max(
      config.minHeight,
      Math.min(config.maxHeight, camera.position.y + deltaY * 0.01)
    );
    
    // Пересчет позиции камеры
    const distance = camera.userData.distance || 2.5;
    camera.position.x = Math.sin(camera.userData.angle) * distance;
    camera.position.z = Math.cos(camera.userData.angle) * distance;
    camera.lookAt(0, 0, 0);
    
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
  });
  
  // Колесо мыши для зума
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const distance = camera.userData.distance || 2.5;
    const newDistance = Math.max(
      config.minDistance,
      Math.min(config.maxDistance, distance + e.deltaY * 0.001 * config.zoomSpeed)
    );
    
    camera.userData.distance = newDistance;
    camera.position.x = Math.sin(camera.userData.angle) * newDistance;
    camera.position.z = Math.cos(camera.userData.angle) * newDistance;
    camera.lookAt(0, 0, 0);
  }, { passive: false });
  
  // Устанавливаем курсор
  canvas.style.cursor = 'grab';
  
  console.log('🖱️ Управление мышкой активировано');
  console.log('   - Зажмите ЛКМ и двигайте для вращения');
  console.log('   - Колесо мыши для зума');
}