import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';
import { createRoadNetwork } from './roads/road_system.js';
import { TrafficManager } from './traffic/traffic_manager.js';

export const startAR = async () => {
  const container = document.querySelector("#ar-container");

  const mindarThree = new MindARThree({
    container,
    imageTargetSrc: '/assets/carpet.mind', // КРИТИЧНО: абсолютный путь
    maxTrack: 1
  });

  const { renderer, scene, camera } = mindarThree;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));
  const dl = new THREE.DirectionalLight(0xffffff, 1.5);
  dl.position.set(5, 10, 7);
  scene.add(dl);

  const anchor = mindarThree.addAnchor(0);
  const gameGroup = new THREE.Group();
  anchor.group.add(gameGroup);

  const roadNetwork = createRoadNetwork(gameGroup);
  const trafficManager = new TrafficManager(gameGroup, roadNetwork);

  // 🚗 АВТОСТАРТ МАШИН
  trafficManager.spawnCars(5);
  trafficManager.setGlobalScale(1.0);

  // pinch zoom
  let lastDist = null;
  container.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist = Math.hypot(dx, dy);
    }
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && lastDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      const delta = (d - lastDist) * 0.005;
      trafficManager.setGlobalScale(
        Math.max(0.1, trafficManager.globalScale + delta)
      );
      lastDist = d;
    }
  }, { passive: true });

  container.addEventListener('touchend', () => lastDist = null);

  await mindarThree.start();

  renderer.setAnimationLoop(() => {
    trafficManager.update();
    renderer.render(scene, camera);
  });
};
