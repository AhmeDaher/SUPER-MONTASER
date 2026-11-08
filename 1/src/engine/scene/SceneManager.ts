import * as THREE from 'three';

export class SceneManager {
  public scene: THREE.Scene;
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public rimLight: THREE.DirectionalLight;

  constructor() {
    this.scene = new THREE.Scene();

    // Tropical jungle atmospheric fog
    this.scene.background = new THREE.Color('#80deea'); // Tropical azure sky
    this.scene.fog = new THREE.FogExp2('#204528', 0.012);

    // 1. Warm Tropical Sunlight
    this.sunLight = new THREE.DirectionalLight('#fff8e1', 2.2);
    this.sunLight.position.set(35, 55, 25);
    this.sunLight.castShadow = true;

    // Shadow camera bounds
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 130;
    const d = 50;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0008;

    this.scene.add(this.sunLight);

    // 2. Hemispheric Ambient Light (Sky / Forest Floor)
    this.hemiLight = new THREE.HemisphereLight('#b3e5fc', '#2e7d32', 1.1);
    this.scene.add(this.hemiLight);

    // 3. Gentle Back Rim Light for character outline clarity
    this.rimLight = new THREE.DirectionalLight('#e0f7fa', 0.6);
    this.rimLight.position.set(-25, 30, -35);
    this.scene.add(this.rimLight);
  }

  public updateShadowFollow(characterPos: THREE.Vector3) {
    // Keep sun shadow frustum centered smoothly around player
    this.sunLight.position.set(
      characterPos.x + 35,
      characterPos.y + 55,
      characterPos.z + 25
    );
    this.sunLight.target.position.copy(characterPos);
    this.sunLight.target.updateMatrixWorld();
  }
}
