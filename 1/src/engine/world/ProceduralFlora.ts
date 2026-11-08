import * as THREE from 'three';

export class ProceduralFlora {
  public instancedGrass: THREE.InstancedMesh | null = null;
  private grassMaterial: THREE.ShaderMaterial | null = null;

  constructor() {}

  // 1. Rainforest Palm Tree
  public createPalmTree(): THREE.Group {
    const group = new THREE.Group();

    // Trunk: Series of stacked curved cylinder segments
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x6d4c41,
      roughness: 0.9,
      flatShading: true,
    });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x4e342e,
      roughness: 0.9,
    });

    const segments = 8;
    const trunkHeight = 6.5;
    let currentY = 0;
    let currentX = 0;
    const lean = 0.12 + (Math.random() - 0.5) * 0.15;

    for (let i = 0; i < segments; i++) {
      const segH = trunkHeight / segments;
      const bottomR = 0.42 * (1 - (i / segments) * 0.35);
      const topR = 0.38 * (1 - ((i + 1) / segments) * 0.35);

      const geom = new THREE.CylinderGeometry(topR, bottomR, segH, 6);
      const mesh = new THREE.Mesh(geom, trunkMat);
      mesh.position.set(currentX, currentY + segH / 2, 0);
      mesh.rotation.z = -lean * (i / segments);
      mesh.castShadow = true;
      group.add(mesh);

      // Ring accent
      const ringGeom = new THREE.TorusGeometry(topR * 1.08, 0.04, 4, 8);
      ringGeom.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(currentX, currentY + segH, 0);
      group.add(ring);

      currentY += segH * Math.cos(lean * (i / segments));
      currentX += segH * Math.sin(lean * (i / segments));
    }

    // Palm Crown: Radial curving fronds
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.7,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    const frondCount = 7;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2 + (Math.random() * 0.2);
      const frondGroup = new THREE.Group();
      frondGroup.position.set(currentX, currentY, 0);
      frondGroup.rotation.y = angle;

      // Curved frond leaf shape
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(1.4, 0.4, 3.2, -0.6);
      leafShape.quadraticCurveTo(1.4, -0.2, 0, 0);

      const leafGeom = new THREE.ShapeGeometry(leafShape, 5);
      const leafMesh = new THREE.Mesh(leafGeom, frondMat);
      leafMesh.rotation.x = Math.PI / 2 + 0.35;
      leafMesh.rotation.z = -0.2;
      leafMesh.castShadow = true;
      frondGroup.add(leafMesh);

      group.add(frondGroup);
    }

    // Coconuts at crown base
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
    const cocoGeom = new THREE.SphereGeometry(0.22, 5, 5);
    for (let c = 0; c < 3; c++) {
      const coco = new THREE.Mesh(cocoGeom, coconutMat);
      const ca = (c / 3) * Math.PI * 2;
      coco.position.set(currentX + Math.cos(ca) * 0.35, currentY - 0.2, Math.sin(ca) * 0.35);
      group.add(coco);
    }

    return group;
  }

  // 2. Giant Jungle Banyan / Canopy Tree
  public createBanyanTree(): THREE.Group {
    const group = new THREE.Group();

    // Heavy gnarled trunk
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4e342e,
      roughness: 0.95,
      flatShading: true,
    });

    const trunkGeom = new THREE.CylinderGeometry(0.9, 1.8, 5.0, 7);
    const trunk = new THREE.Mesh(trunkGeom, woodMat);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    group.add(trunk);

    // Buttress roots
    for (let r = 0; r < 4; r++) {
      const rootAngle = (r / 4) * Math.PI * 2;
      const rootGeom = new THREE.ConeGeometry(0.6, 2.2, 4);
      rootGeom.rotateZ(0.4);
      const root = new THREE.Mesh(rootGeom, woodMat);
      root.position.set(Math.cos(rootAngle) * 1.5, 0.8, Math.sin(rootAngle) * 1.5);
      root.rotation.y = rootAngle;
      group.add(root);
    }

    // Multi-layered lush foliage domes
    const foliageMatA = new THREE.MeshStandardMaterial({
      color: 0x1b5e20,
      roughness: 0.8,
      flatShading: true,
    });
    const foliageMatB = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.8,
      flatShading: true,
    });

    const foliagePositions = [
      { x: 0, y: 5.8, z: 0, r: 2.8, mat: foliageMatA },
      { x: 1.5, y: 5.2, z: 1.0, r: 2.1, mat: foliageMatB },
      { x: -1.4, y: 5.0, z: -1.2, r: 2.2, mat: foliageMatA },
      { x: -1.1, y: 5.4, z: 1.3, r: 2.0, mat: foliageMatB },
      { x: 1.2, y: 4.8, z: -1.4, r: 1.9, mat: foliageMatA },
    ];

    foliagePositions.forEach((fp) => {
      const folGeom = new THREE.DodecahedronGeometry(fp.r, 1);
      const folMesh = new THREE.Mesh(folGeom, fp.mat);
      folMesh.position.set(fp.x, fp.y, fp.z);
      folMesh.castShadow = true;
      group.add(folMesh);
    });

    return group;
  }

  // 3. Acacia / Umbrella Tree
  public createAcaciaTree(): THREE.Group {
    const group = new THREE.Group();

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9, flatShading: true });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x689f38, roughness: 0.8, flatShading: true });

    // Slender angled trunk
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.65, 4.2, 5);
    const trunk = new THREE.Mesh(trunkGeom, woodMat);
    trunk.position.set(0.2, 2.1, 0);
    trunk.rotation.z = -0.12;
    trunk.castShadow = true;
    group.add(trunk);

    // Wide flat umbrella canopy
    const canopyGeom = new THREE.CylinderGeometry(2.8, 1.2, 0.9, 8);
    const canopy = new THREE.Mesh(canopyGeom, leafMat);
    canopy.position.set(0.6, 4.4, 0);
    canopy.castShadow = true;
    group.add(canopy);

    const subCanopyGeom = new THREE.CylinderGeometry(2.1, 0.8, 0.7, 7);
    const subCanopy = new THREE.Mesh(subCanopyGeom, leafMat);
    subCanopy.position.set(-0.8, 3.8, 0.5);
    subCanopy.castShadow = true;
    group.add(subCanopy);

    return group;
  }

  // 4. Jungle Fern Plant
  public createFern(): THREE.Group {
    const group = new THREE.Group();
    const fernMat = new THREE.MeshStandardMaterial({
      color: 0x33691e,
      roughness: 0.7,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    const frondCount = 6;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.3, 0.5, 0.1, 1.4);
      leafShape.quadraticCurveTo(-0.2, 0.6, 0, 0);

      const leafGeom = new THREE.ShapeGeometry(leafShape, 3);
      const leafMesh = new THREE.Mesh(leafGeom, fernMat);
      leafMesh.rotation.y = angle;
      leafMesh.rotation.x = 0.5;
      group.add(leafMesh);
    }
    return group;
  }

  // 5. Procedural Mossy Rock / Boulder
  public createRock(scale: number = 1.0): THREE.Mesh {
    const geom = new THREE.DodecahedronGeometry(scale, 1);
    const pos = geom.attributes.position;

    // Deform vertices for natural rugged organic look
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const noise = Math.sin(x * 3.0) * Math.cos(z * 3.0) * 0.2;
      pos.setXYZ(i, x * (1 + noise), y * 0.8 * (1 + noise), z * (1 + noise));
    }
    geom.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x616161,
      roughness: 0.9,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geom, rockMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 6. Instanced Wind-Blown Grass Blades with Custom GLSL Shader
  public createInstancedGrass(
    positions: THREE.Vector3[],
    density: number = 1800
  ): THREE.InstancedMesh {
    const actualCount = Math.min(positions.length, density);

    // Simple single triangle blade geometry for maximum performance
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.12, 0, 0,
       0.12, 0, 0,
       0.0, 0.85, 0,
    ]);
    const uvs = new Float32Array([
      0, 0,
      1, 0,
      0.5, 1,
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geom.computeVertexNormals();

    // Grass Shader with wind sway (reusing wind wave technique from grass repo)
    this.grassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color('#2e7d32') },
        uTipColor: { value: new THREE.Color('#81c784') },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vec4 worldInstance = instanceMatrix * vec4(position, 1.0);
          
          // Wind sway is proportional to height (uv.y)
          float wind = sin(worldInstance.x * 0.4 + worldInstance.z * 0.3 + uTime * 2.5) * 0.28 * uv.y;
          vec3 transformed = position;
          transformed.x += wind;
          transformed.z += wind * 0.5;

          vNormal = normalMatrix * normal;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uBaseColor;
        uniform vec3 uTipColor;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec3 col = mix(uBaseColor, uTipColor, vUv.y);
          // Simple top diffuse lighting
          float light = max(dot(vNormal, vec3(0.4, 0.8, 0.4)), 0.3) + 0.3;
          gl_FragColor = vec4(col * light, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const instancedMesh = new THREE.InstancedMesh(geom, this.grassMaterial, actualCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < actualCount; i++) {
      const p = positions[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      const s = 0.8 + Math.random() * 0.6;
      dummy.scale.set(s, s * (0.8 + Math.random() * 0.5), s);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.receiveShadow = true;
    this.instancedGrass = instancedMesh;

    return instancedMesh;
  }

  public update(time: number) {
    if (this.grassMaterial) {
      this.grassMaterial.uniforms.uTime.value = time;
    }
  }
}
