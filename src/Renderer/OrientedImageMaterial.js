import * as THREE from 'three';
import textureVS from './Shader/ProjectiveTextureVS.glsl';
import textureFS from './Shader/ProjectiveTextureFS.glsl';
import ShaderUtils from './Shader/ShaderUtils';
import Capabilities from '../Core/System/Capabilities';

var ndcToTextureMatrix = new THREE.Matrix4().set(
    1, 0, 0, 1,
    0, 1, 0, 1,
    0, 0, 2, 0,
    0, 0, 0, 2);

class OrientedImageMaterial extends THREE.RawShaderMaterial {
    constructor(cameras, options = {}) {
        options.side = options.side !== undefined ? options.side : THREE.DoubleSide;
        options.transparent = options.transparent !== undefined ? options.transparent : true;
        options.opacity = options.opacity !== undefined ? options.opacity : 0.1;
        super(options);
        this.defines.NUM_TEXTURES = cameras.length;
        this.defines.USE_DISTORTION = Number(cameras.some(camera => camera.distortion !== undefined));
        this.alphaBorder = 20;
        this.cameras = cameras;
        var textureMatrix = [];
        var texture = [];
        var distortion = [];
        this.group = new THREE.Group();
        for (let i = 0; i < cameras.length; ++i) {
            const camera = cameras[i];
            camera.needsUpdate = true;
            camera.textureMatrix = new THREE.Matrix4();
            camera.textureMatrixWorldInverse = new THREE.Matrix4();
            textureMatrix[i] = camera.textureMatrix.clone();
            texture[i] = new THREE.Texture();
            distortion[i] = {};
            distortion[i].size = camera.size;
            if (camera.distortion) {
                distortion[i].polynom = camera.distortion.polynom;
                distortion[i].pps = camera.distortion.pps;
                distortion[i].l1l2 = camera.distortion.l1l2;
            }
            this.group.add(camera);
        }
        this.uniforms = {};
        this.uniforms.projectiveTextureAlphaBorder = new THREE.Uniform(this.alphaBorder);
        this.uniforms.projectiveTextureDistortion = new THREE.Uniform(distortion);
        this.uniforms.projectiveTextureMatrix = new THREE.Uniform(textureMatrix);
        this.uniforms.projectiveTexture = new THREE.Uniform(texture);
        if (Capabilities.isLogDepthBufferSupported()) {
            this.defines.USE_LOGDEPTHBUF = 1;
            this.defines.USE_LOGDEPTHBUF_EXT = 1;
        }
        this.vertexShader = textureVS;
        this.fragmentShader = ShaderUtils.unrollLoops(textureFS, this.defines);
    }

    setTextures(textures, feature) {
        if (!textures) return;
        this.group.position.copy(feature.position);
        this.group.quaternion.copy(feature.quaternion);
        this.group.updateMatrixWorld(true); // update the matrixWorldInverse of the cameras
        if (this.helpers) {
            // todo: move this to OrientedImageDebug
            this.helpers.updateMatrixWorld(true); // update the matrixWorld of the helpers
        }
        for (let i = 0; i < textures.length; ++i) {
            var oldTexture = this.uniforms.projectiveTexture.value[i];
            this.uniforms.projectiveTexture.value[i] = textures[i];
            if (oldTexture) oldTexture.dispose();
            this.cameras[i].needsUpdate = true;
        }
    }

    updateUniforms(viewCamera) {
        // update the uniforms using the current value of camera.matrixWorld
        for (var i = 0; i < this.cameras.length; ++i) {
            const camera = this.cameras[i];
            if (camera.needsUpdate) {
                camera.updateMatrixWorld(true);
                camera.textureMatrix.copy(ndcToTextureMatrix).multiply(camera.projectionMatrix);
                camera.textureMatrixWorldInverse.multiplyMatrices(camera.textureMatrix, camera.matrixWorldInverse);
                camera.needsUpdate = false;
            }
            this.uniforms.projectiveTextureMatrix.value[i].multiplyMatrices(camera.textureMatrixWorldInverse, viewCamera.matrixWorld);
        }
    }
}

export default OrientedImageMaterial;
