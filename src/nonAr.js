import * as THREE from "three";
import { spawnCars } from "./cars/CarModels.js";

export function startNonAR(mode) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.01, 10);
  camera.position.set(0,0.8,0.8);
  camera.lookAt(0,0,0);

  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  scene.background = new THREE.TextureLoader()
    .load("./assets/carpet-scan.jpg");

  scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1));
  spawnCars(scene);

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
