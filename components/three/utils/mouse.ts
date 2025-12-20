import * as THREE from 'three';

export class Mouse {
    position: THREE.Vector2;

    constructor() {
        this.position = new THREE.Vector2();
    }

    updatePosition(e: MouseEvent, domElement?: HTMLElement) {
        const rect = domElement?.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        };
        
        this.position.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.position.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
}