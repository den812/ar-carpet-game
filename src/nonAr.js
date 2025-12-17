import * as THREE from "three";
import { createRoadNetwork } from "./roads/road_system.js";
import { TrafficManager } from "./traffic/traffic_manager.js";

export function startNonAR(mode) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);

  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  let radius = 2.5;
  let theta = 0.5;
  let phi = 1.1;

  function updateCamera() {
    camera.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(0, 0, 0);
  }
  updateCamera();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2);
  dl.position.set(5, 10, 5);
  scene.add(dl);

  const world = new THREE.Group();
  scene.add(world);

  const roadNetwork = createRoadNetwork(world);
  const trafficManager = new TrafficManager(world, roadNetwork);

  // 🚗 АВТОСТАРТ
  trafficManager.spawnCars(7);
  trafficManager.setGlobalScale(1.0);

  // мышь - вращение
  let dragging = false;
  let prev = { x: 0, y: 0 };

  renderer.domElement.addEventListener('mousedown', e => {
    dragging = true;
    prev = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => dragging = false);

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    theta -= (e.clientX - prev.x) * 0.005;
    phi += (e.clientY - prev.y) * 0.005;
    phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));
    prev = { x: e.clientX, y: e.clientY };
    updateCamera();
  });

  // ✅ ЗУМ КОЛЕСОМ МЫШИ
  renderer.domElement.addEventListener('wheel', e => {
    radius += e.deltaY * 0.002;
    radius = Math.max(1.2, Math.min(6, radius));
    updateCamera();
  });

  renderer.setAnimationLoop(() => {
    trafficManager.update();
    renderer.render(scene, camera);
  });
}
