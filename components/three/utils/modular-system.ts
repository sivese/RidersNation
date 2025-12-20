import * as THREE from 'three';

export function showBoundingBox(model: THREE.Object3D, scene: THREE.Scene) {
  const box = new THREE.Box3().setFromObject(model);
  
  const boxHelper = new THREE.BoxHelper(model, 0x00ff00); // 녹색
  scene.add(boxHelper);
}