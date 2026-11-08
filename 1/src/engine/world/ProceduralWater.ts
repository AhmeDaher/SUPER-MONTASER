import * as THREE from 'three';

export class ProceduralWater {
  public riverMesh: THREE.Mesh | null = null;
  public waterfallMesh: THREE.Mesh | null = null;
  public mistParticles: THREE.Points | null = null;
  private riverMaterial: THREE.ShaderMaterial | null = null;
  private waterfallMaterial: THREE.ShaderMaterial | null = null;
  private mistPositions: Float32Array | null = null;

  constructor() {}

  public createRiver(getRiverCenter: (z: number) => number): THREE.Mesh {
    // Generate curved river geometry following the river spline
    const zStart = -40;
    const zEnd = 70;
    const segmentsZ = 120;
    const segmentsX = 14;
    const riverHalfWidth = 6.2;

    const geometry = new THREE.PlaneGeometry(
      riverHalfWidth * 2,
      zEnd - zStart,
      segmentsX,
      segmentsZ
    );
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const originalX = pos.getX(i);
      const centerX = getRiverCenter(z);
      pos.setX(i, centerX + originalX);

      // Water surface height gently slopes from -0.2 near waterfall to -0.6 downstream
      const t = (z - zStart) / (zEnd - zStart);
      pos.setY(i, -0.2 - t * 0.4);
    }
    geometry.computeVertexNormals();

    // Custom GLSL River Shader
    this.riverMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunColor: { value: new THREE.Color('#fff9c4') },
        uDeepWater: { value: new THREE.Color('#00695c') },
        uShallowWater: { value: new THREE.Color('#26c6da') },
        uFoamColor: { value: new THREE.Color('#e0f7fa') },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Gentle wave ripples
          float wave = sin(pos.x * 0.8 + uTime * 2.2) * cos(pos.z * 0.6 + uTime * 1.8) * 0.08;
          wave += sin(pos.z * 1.4 - uTime * 3.0) * 0.04;
          pos.y += wave;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          vNormal = normalMatrix * normal;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunColor;
        uniform vec3 uDeepWater;
        uniform vec3 uShallowWater;
        uniform vec3 uFoamColor;

        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        void main() {
          // Animated ripples
          float ripple = sin(vWorldPosition.x * 2.0 + uTime * 2.5) * sin(vWorldPosition.z * 2.0 - uTime * 2.0);
          
          // Shore foam approximation near edges
          float edgeDist = abs(vUv.x - 0.5) * 2.0;
          float foam = smoothstep(0.72, 0.98, edgeDist + ripple * 0.08);

          // Deep to shallow gradient
          vec3 waterCol = mix(uDeepWater, uShallowWater, ripple * 0.2 + 0.5);
          vec3 finalColor = mix(waterCol, uFoamColor, foam * 0.7);

          // Specular sun highlight
          vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 halfDir = normalize(lightDir + viewDir);
          float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
          finalColor += uSunColor * spec * 0.5;

          gl_FragColor = vec4(finalColor, 0.82);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.riverMesh = new THREE.Mesh(geometry, this.riverMaterial);
    return this.riverMesh;
  }

  public createWaterfall(cliffX: number, cliffZ: number, topY: number, bottomY: number): THREE.Mesh {
    const width = 8.5;
    const height = topY - bottomY;
    const geometry = new THREE.PlaneGeometry(width, height, 20, 30);
    geometry.translate(0, height / 2, 0);

    // Custom GLSL Waterfall Shader with downward scrolling foam
    this.waterfallMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#4dd0e1') },
        uColorB: { value: new THREE.Color('#ffffff') },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vec3 pos = position;
          // Outward turbulent billowing
          float billow = sin(pos.y * 1.5 - uTime * 8.0) * cos(pos.x * 2.0) * 0.18;
          pos.z += billow;

          vNormal = normalMatrix * normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          // Fast downward foam streaks
          float stream = sin((vUv.y * 18.0 + uTime * 9.0) + sin(vUv.x * 24.0)) * 0.5 + 0.5;
          float foam = smoothstep(0.4, 0.85, stream);
          
          vec3 col = mix(uColorA, uColorB, foam);
          float alpha = 0.85 + foam * 0.12;

          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.waterfallMesh = new THREE.Mesh(geometry, this.waterfallMaterial);
    this.waterfallMesh.position.set(cliffX, bottomY, cliffZ);
    // Face downstream towards +z
    this.waterfallMesh.rotation.y = 0;

    // Plunge pool mist particles
    this.createMistParticles(cliffX, cliffZ + 1.2, bottomY + 0.4);

    return this.waterfallMesh;
  }

  private createMistParticles(x: number, z: number, y: number) {
    const count = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = x + (Math.random() - 0.5) * 8.0;
      positions[i * 3 + 1] = y + Math.random() * 2.8;
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 4.0;
      scales[i] = 0.4 + Math.random() * 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    this.mistPositions = positions;

    // Particle material
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mistParticles = new THREE.Points(geometry, mat);
  }

  public update(time: number) {
    if (this.riverMaterial) {
      this.riverMaterial.uniforms.uTime.value = time;
    }
    if (this.waterfallMaterial) {
      this.waterfallMaterial.uniforms.uTime.value = time;
    }

    // Animate mist particles rising and swirling
    if (this.mistParticles && this.mistPositions) {
      const posAttr = this.mistParticles.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        let py = posAttr.getY(i) + 0.015;
        if (py > 3.5) {
          py = 0.1;
        }
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;
    }
  }
}
