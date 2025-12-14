import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { roads } from "../roads/roadNetwork.js";
import { Car } from "./Car.js";

const loader = new GLTFLoader();
const urls = [
  "./assets/models/Buggy.glb",
  "./assets/models/Duck.glb",
  "./assets/models/CesiumMilkTruck.glb"
];

const models = [];

async function loadModels() {
  if (models.length) return;
  for (const u of urls) {
    const g = await loader.loadAsync(u);
    models.push(g.scene);
  }
}

export async function spawnCars(parent) {
  await loadModels();
  const cars = [];

  for (let i=0;i<5;i++) {
    const m = models[Math.floor(Math.random()*models.length)].clone(true);
    m.scale.setScalar(0.02);
    parent.add(m);

    const car = new Car(m, i%2 ? roads.h : roads.v);
    cars.push(car);
  }

  parent.addEventListener?.("click", e => {
    const c = e.target.userData.car;
    if (c) c.toggle();
  });

  function loop() {
    cars.forEach(c => c.update(1));
    requestAnimationFrame(loop);
  }
  loop();
}
