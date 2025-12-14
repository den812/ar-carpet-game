import * as THREE from "three";
const o = 0.02;

export const roads = {
  h: new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.45,0,-0.1-o),
    new THREE.Vector3( 0.45,0,-0.1-o)
  ]),
  v: new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1+o,0,-0.45),
    new THREE.Vector3(0.1+o,0, 0.45)
  ])
};
