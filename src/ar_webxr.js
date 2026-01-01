// ===================================
// ФАЙЛ: src/ar_webxr.js V20 MOBILE FIX
// МИНИМУМ КОДА - МАКСИМУМ СОВМЕСТИМОСТИ
// ===================================

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { createRoadNetwork } from './roads/road_system.js';
import { TrafficManager } from './traffic/traffic_manager.js';
import { StatsPanel } from './ui/StatsPanel.js';
import { ControlPanel } from './ui/ControlPanel.js';

export const startAR = async (settings = {}) => {
  try {
    console.log('AR START');
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));
    scene.add(new THREE.DirectionalLight(0xffffff, 0.8).position.set(1, 2, 1));
    
    const group = new THREE.Group();
    group.visible = false;
    scene.add(group);
    
    const network = createRoadNetwork(group, { showRoads: settings.showRoads });
    const traffic = new TrafficManager(group, network);
    
    if (settings.showStats !== false) new StatsPanel().show();
    if (settings.showControl !== false) new ControlPanel(traffic).show();
    
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    
    let placed = false;
    
    const btn = document.createElement('button');
    btn.textContent = '📍';
    btn.style.cssText = 'position:fixed;bottom:20%;left:50%;transform:translateX(-50%);padding:15px 30px;font-size:20px;background:#0f0;color:#000;border:3px solid #0f0;border-radius:12px;cursor:pointer;z-index:9999;display:none;';
    document.body.appendChild(btn);
    
    btn.onclick = () => {
      if (!reticle.visible) return;
      const p = new THREE.Vector3();
      reticle.getWorldPosition(p);
      group.position.copy(p);
      group.position.y += 0.01;
      group.visible = true;
      placed = true;
      btn.style.display = 'none';
      traffic.spawnCars(7);
      traffic.setGlobalScale(1.0);
    };
    
    let hitSrc = null, hitReq = false;
    
    const arBtn = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    arBtn.style.cssText = 'position:fixed;bottom:5%;right:5%;padding:15px;background:#f0f;color:#fff;border:none;border-radius:50%;font-size:20px;z-index:9999;';
    arBtn.textContent = '🚀';
    document.body.appendChild(arBtn);
    
    renderer.xr.addEventListener('sessionstart', () => {
      btn.style.display = 'block';
      arBtn.style.display = 'none';
    });
    
    renderer.xr.addEventListener('sessionend', () => {
      location.reload();
    });
    
    renderer.setAnimationLoop((t, frame) => {
      if (frame) {
        const ref = renderer.xr.getReferenceSpace();
        const ses = renderer.xr.getSession();
        
        if (!hitReq && ses) {
          ses.requestReferenceSpace('viewer').then(s => {
            ses.requestHitTestSource({ space: s }).then(h => {
              hitSrc = h;
            }).catch(() => {});
          }).catch(() => {});
          hitReq = true;
        }
        
        if (hitSrc && !placed) {
          try {
            const hits = frame.getHitTestResults(hitSrc);
            if (hits.length > 0) {
              const pose = hits[0].getPose(ref);
              if (pose) {
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
              }
            } else {
              reticle.visible = false;
            }
          } catch (e) {}
        }
        
        if (placed) {
          traffic.update();
        }
      }
      
      renderer.render(scene, camera);
    });
    
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    console.log('AR OK');
  } catch (err) {
    console.error('AR ERROR:', err);
    alert('AR не работает:\n' + err.message + '\n\nИспользуйте TOUCH режим');
    throw err;
  }
};