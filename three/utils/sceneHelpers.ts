import * as THREE from "three";

/**
 * Center and scale a model to fit within a standard size
 */
export const centerAndScaleModel = (model: THREE.Group) => {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 3 / maxDim;

  model.scale.multiplyScalar(scale);
  model.position.x = -center.x * scale;
  model.position.y = -box.min.y * scale;
  model.position.z = -center.z * scale;
};

/**
 * Enable shadows for all meshes in a model
 */
export const enableShadows = (model: THREE.Group) => {
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
};

/**
 * Store original materials from a model
 */
export const storeOriginalMaterials = (
  model: THREE.Group,
  storage: Map<THREE.Mesh, THREE.Material | THREE.Material[]>
) => {
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      storage.set(mesh, mesh.material);
    }
  });
};
