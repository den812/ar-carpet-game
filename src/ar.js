import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { spawnCars } from "./cars/CarModels.js";

export async function startAR() {
  const mindar = new MindARThree({
    container: document.body,
    imageTargetSrc: "./assets/carpet.mind"
  });

  const { scene, camera, renderer } = mindar;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

  const anchor = mindar.addAnchor(0);
  spawnCars(anchor.group);

  await mindar.start();

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
