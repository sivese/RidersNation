import * as THREE from 'three';

export class Mouse {
    position: THREE.Vector2 = new THREE.Vector2();

    updatePosition(event: MouseEvent) {
        this.position.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.position.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
}