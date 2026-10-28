import * as THREE from "three";

const pivot = new THREE.Vector3(),
  rotation = new THREE.Quaternion(),
  matrix = new THREE.Matrix4();
const axis = new THREE.Vector3(0, 0, 1),
  scale = new THREE.Vector3(1, 1, 1);

// Three instance batches replace 32 separate cabin/window draw calls. Their
// local counter-rotation keeps passengers upright as the parent wheel turns.
export function setIndustrialCabinAngle(rotor, angle) {
  rotation.setFromAxisAngle(axis, -angle);
  for (const cabins of rotor.children) {
    const pivots = cabins.userData.uprightPivots;
    if (!pivots) continue;
    pivots.forEach((position, index) => {
      matrix.compose(pivot.fromArray(position), rotation, scale);
      cabins.setMatrixAt(index, matrix);
    });
    cabins.instanceMatrix.needsUpdate = true;
  }
}
