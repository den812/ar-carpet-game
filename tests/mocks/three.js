// ===================================
// ФАЙЛ: tests/mocks/three.js
// Mock для Three.js
// ===================================

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
  
  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
}

export class Euler {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  clone() {
    return new Euler(this.x, this.y, this.z);
  }
}

export class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  
  clone() {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }
}

export class Matrix4 {
  constructor() {
    this.elements = new Array(16).fill(0);
  }
  
  fromArray(array) {
    this.elements = [...array];
    return this;
  }
  
  clone() {
    const m = new Matrix4();
    m.elements = [...this.elements];
    return m;
  }
}

export class Scene {
  constructor() {
    this.children = [];
    this.background = null;
  }
  
  add(obj) {
    this.children.push(obj);
  }
  
  remove(obj) {
    const index = this.children.indexOf(obj);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }
}

export class Group {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Euler();
    this.scale = new Vector3(1, 1, 1);
    this.visible = true;
    this.children = [];
    this.parent = null;
  }
  
  add(obj) {
    obj.parent = this;
    this.children.push(obj);
  }
  
  remove(obj) {
    const index = this.children.indexOf(obj);
    if (index > -1) {
      this.children.splice(index, 1);
      obj.parent = null;
    }
  }
  
  traverse(callback) {
    callback(this);
    this.children.forEach(child => {
      if (child.traverse) {
        child.traverse(callback);
      }
    });
  }
  
  clone() {
    const cloned = new Group();
    cloned.position = this.position.clone();
    cloned.rotation = this.rotation.clone();
    cloned.scale = this.scale.clone();
    cloned.visible = this.visible;
    cloned.children = this.children.map(child => 
      child.clone ? child.clone() : child
    );
    return cloned;
  }
}

export class Mesh extends Group {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.isMesh = true;
    this.matrixAutoUpdate = true;
    this.matrix = new Matrix4();
  }
  
  getWorldPosition(target) {
    target.copy(this.position);
    return target;
  }
  
  clone() {
    const cloned = new Mesh(this.geometry, this.material);
    cloned.position = this.position.clone();
    cloned.rotation = this.rotation.clone();
    cloned.scale = this.scale.clone();
    cloned.visible = this.visible;
    cloned.children = this.children.map(child => 
      child.clone ? child.clone() : child
    );
    return cloned;
  }
}

export class PerspectiveCamera {
  constructor(fov, aspect, near, far) {
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.position = new Vector3();
    this.rotation = new Euler();
  }
  
  updateProjectionMatrix() {}
  lookAt(x, y, z) {}
}

export class WebGLRenderer {
  constructor(params) {
    this.domElement = document.createElement('canvas');
    this.xr = {
      enabled: false,
      getSession: jest.fn(),
      getReferenceSpace: jest.fn(),
      addEventListener: jest.fn()
    };
  }
  
  setSize(width, height) {}
  setPixelRatio(ratio) {}
  render(scene, camera) {}
  setAnimationLoop(callback) {
    this.animationLoop = callback;
  }
}

export class Color {
  constructor(color) {
    this.r = 1;
    this.g = 1;
    this.b = 1;
  }
  
  setHSL(h, s, l) {
    return this;
  }
  
  copy(color) {
    this.r = color.r;
    this.g = color.g;
    this.b = color.b;
    return this;
  }
  
  clone() {
    const c = new Color();
    c.r = this.r;
    c.g = this.g;
    c.b = this.b;
    return c;
  }
}

export class PlaneGeometry {
  clone() {
    return new PlaneGeometry();
  }
}

export class RingGeometry {
  rotateX(angle) {
    return this;
  }
  
  clone() {
    return new RingGeometry();
  }
}

export class CircleGeometry {
  clone() {
    return new CircleGeometry();
  }
}

export class BoxGeometry {
  clone() {
    return new BoxGeometry();
  }
}

export class BufferGeometry {
  setFromPoints(points) {
    return this;
  }
  
  clone() {
    return new BufferGeometry();
  }
}

export class MeshBasicMaterial {
  constructor(params) {
    this.color = params?.color ? new Color(params.color) : new Color();
    this.side = params?.side;
  }
  
  clone() {
    const m = new MeshBasicMaterial({ color: this.color, side: this.side });
    return m;
  }
}

export class MeshStandardMaterial {
  constructor(params) {
    this.color = params?.color ? new Color(params.color) : new Color();
    this.map = params?.map;
    this.side = params?.side;
    this.roughness = params?.roughness || 0.5;
  }
  
  clone() {
    const m = new MeshStandardMaterial({
      color: this.color,
      map: this.map,
      side: this.side,
      roughness: this.roughness
    });
    return m;
  }
}

export class LineDashedMaterial {
  constructor(params) {
    this.color = new Color(params?.color);
    this.linewidth = params?.linewidth;
    this.dashSize = params?.dashSize;
    this.gapSize = params?.gapSize;
  }
  
  clone() {
    return new LineDashedMaterial({
      color: this.color,
      linewidth: this.linewidth,
      dashSize: this.dashSize,
      gapSize: this.gapSize
    });
  }
}

export class Line {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
  }
  
  computeLineDistances() {}
  
  clone() {
    return new Line(this.geometry, this.material);
  }
}

export class HemisphereLight {
  constructor(skyColor, groundColor, intensity) {
    this.skyColor = skyColor;
    this.groundColor = groundColor;
    this.intensity = intensity;
  }
}

export class DirectionalLight {
  constructor(color, intensity) {
    this.color = color;
    this.intensity = intensity;
    this.position = new Vector3();
  }
}

export class AmbientLight {
  constructor(color, intensity) {
    this.color = color;
    this.intensity = intensity;
  }
}

export class TextureLoader {
  load(url, onLoad, onProgress, onError) {
    setTimeout(() => {
      if (onLoad) {
        onLoad({ image: new Image() });
      }
    }, 10);
  }
}

export const MathUtils = {
  degToRad: (degrees) => degrees * (Math.PI / 180)
};

export const DoubleSide = 2;
export const REVISION = '158';