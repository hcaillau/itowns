// import * as THREE from 'three';
import FirstPersonControls from './FirstPersonControls';

class FirstPersonControlsGlobe extends FirstPersonControls {
    constructor(view, options = {}) {
        super(view, options);
    }

    translateY(dt, sign) {
        // compute geodesic normale
        const normal = this.camera.position.clone().normalize();
        this.camera.position.add(normal.multiplyScalar(sign * this.options.moveSpeed * dt / 1000));
    }
}

export default FirstPersonControlsGlobe;
