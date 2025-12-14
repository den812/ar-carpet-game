export class Car {
  constructor(mesh, path) {
    this.mesh = mesh;
    this.path = path;
    this.t = Math.random();
    this.speed = 0.0004;
    this.stop = false;

    mesh.userData.car = this;
    mesh.traverse(o => o.isMesh && (o.userData.car = this));
  }

  toggle() {
    this.stop = !this.stop;
  }

  update(dt) {
    if (this.stop) return;
    this.t = (this.t + this.speed * dt) % 1;
    const p = this.path.getPointAt(this.t);
    const n = this.path.getPointAt((this.t+0.01)%1);
    this.mesh.position.copy(p);
    this.mesh.lookAt(n);
  }
}
