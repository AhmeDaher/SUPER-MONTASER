import * as THREE from 'three';

export interface RiggedCharacter {
  rootGroup: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  hatGroup: THREE.Group;
  backpackGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftForearmGroup: THREE.Group;
  rightForearmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  leftCalfGroup: THREE.Group;
  rightCalfGroup: THREE.Group;
}

export class ProceduralCharacterFactory {
  constructor() {}

  public createMrMontaser(): RiggedCharacter {
    const rootGroup = new THREE.Group();
    rootGroup.name = 'MrMontaser';

    // Materials Palette
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffcc80,
      roughness: 0.6,
    });
    const safariJacketMat = new THREE.MeshStandardMaterial({
      color: 0xd7ccc8, // Khaki beige
      roughness: 0.7,
      flatShading: true,
    });
    const shortsMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63, // Safari brown shorts
      roughness: 0.75,
      flatShading: true,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x4e342e, // Deep brown boots
      roughness: 0.8,
    });
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0, // Off-white pith helmet
      roughness: 0.65,
      flatShading: true,
    });
    const hatBandMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723, // Dark leather band
      roughness: 0.6,
    });
    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32, // Explorer green backpack
      roughness: 0.8,
      flatShading: true,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.8,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a237e });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.9 });

    // 1. Torso Group
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 1.05;

    // Torso body: Rounded tapered box
    const torsoGeom = new THREE.BoxGeometry(0.68, 0.72, 0.44);
    const torsoMesh = new THREE.Mesh(torsoGeom, safariJacketMat);
    torsoMesh.castShadow = true;
    torsoGroup.add(torsoMesh);

    // Safari Jacket Collar
    const collarGeom = new THREE.ConeGeometry(0.38, 0.18, 5);
    collarGeom.rotateX(Math.PI);
    const collar = new THREE.Mesh(collarGeom, safariJacketMat);
    collar.position.set(0, 0.38, 0.12);
    torsoGroup.add(collar);

    // Brass Jacket Buttons
    const buttonGeom = new THREE.SphereGeometry(0.04, 6, 6);
    for (let b = 0; b < 3; b++) {
      const btn = new THREE.Mesh(buttonGeom, goldMat);
      btn.position.set(0, 0.18 - b * 0.14, 0.23);
      torsoGroup.add(btn);
    }

    // Safari Utility Belt
    const beltGeom = new THREE.BoxGeometry(0.72, 0.12, 0.48);
    const belt = new THREE.Mesh(beltGeom, hatBandMat);
    belt.position.y = -0.32;
    torsoGroup.add(belt);

    // Brass Belt Buckle
    const buckleGeom = new THREE.BoxGeometry(0.14, 0.14, 0.04);
    const buckle = new THREE.Mesh(buckleGeom, goldMat);
    buckle.position.set(0, -0.32, 0.25);
    torsoGroup.add(buckle);

    // Canteen on side of belt
    const canteenGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.18, 8);
    const canteen = new THREE.Mesh(canteenGeom, goldMat);
    canteen.position.set(0.4, -0.28, 0);
    canteen.rotation.z = 0.2;
    torsoGroup.add(canteen);

    // 2. Adventure Backpack
    const backpackGroup = new THREE.Group();
    backpackGroup.position.set(0, 0.05, -0.32);

    const packMain = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.28), backpackMat);
    packMain.castShadow = true;
    backpackGroup.add(packMain);

    // Rolled Sleeping Mat on top of pack
    const bedrollGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.62, 8);
    bedrollGeom.rotateZ(Math.PI / 2);
    const bedroll = new THREE.Mesh(bedrollGeom, hatMat);
    bedroll.position.set(0, 0.36, 0);
    backpackGroup.add(bedroll);

    torsoGroup.add(backpackGroup);

    // 3. Head Group (Neck pivot)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.52, 0);

    // Cartoon Head (Sphere / Rounded Box)
    const headGeom = new THREE.SphereGeometry(0.34, 16, 16);
    headGeom.scale(1.0, 1.08, 0.95);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Friendly Cartoon Eyes
    const eyeGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(0.12, 0.06, 0.3);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-0.12, 0.06, 0.3);
    headGroup.add(rightEye);

    // Cartoon Nose
    const noseGeom = new THREE.SphereGeometry(0.065, 8, 8);
    const nose = new THREE.Mesh(noseGeom, skinMat);
    nose.position.set(0, -0.01, 0.35);
    headGroup.add(nose);

    // Explorer Moustache
    const stacheGeom = new THREE.TorusGeometry(0.1, 0.035, 6, 8, Math.PI);
    stacheGeom.rotateZ(Math.PI);
    const stache = new THREE.Mesh(stacheGeom, hairMat);
    stache.position.set(0, -0.09, 0.32);
    headGroup.add(stache);

    // Smiling Mouth
    const smileGeom = new THREE.TorusGeometry(0.08, 0.02, 4, 8, Math.PI);
    const smile = new THREE.Mesh(smileGeom, hairMat);
    smile.position.set(0, -0.16, 0.3);
    headGroup.add(smile);

    // 4. Explorer Pith Helmet / Safari Hat
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.22, 0);

    // Dome crown
    const hatDomeGeom = new THREE.SphereGeometry(0.38, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const hatDome = new THREE.Mesh(hatDomeGeom, hatMat);
    hatGroup.add(hatDome);

    // Wide curved hat brim
    const brimGeom = new THREE.CylinderGeometry(0.56, 0.58, 0.05, 16);
    const brim = new THREE.Mesh(brimGeom, hatMat);
    brim.position.y = -0.02;
    hatGroup.add(brim);

    // Hat Band
    const hatBandGeom = new THREE.CylinderGeometry(0.39, 0.39, 0.08, 16);
    const hatBand = new THREE.Mesh(hatBandGeom, hatBandMat);
    hatBand.position.y = 0.08;
    hatGroup.add(hatBand);

    headGroup.add(hatGroup);
    torsoGroup.add(headGroup);

    // 5. Left Arm Group (Shoulder pivot)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(0.44, 0.26, 0);

    const upperArmGeom = new THREE.CylinderGeometry(0.11, 0.1, 0.32, 8);
    upperArmGeom.translate(0, -0.16, 0);
    const leftUpperArm = new THREE.Mesh(upperArmGeom, safariJacketMat);
    leftUpperArm.castShadow = true;
    leftArmGroup.add(leftUpperArm);

    // Left Forearm (Elbow pivot)
    const leftForearmGroup = new THREE.Group();
    leftForearmGroup.position.set(0, -0.32, 0);

    const forearmGeom = new THREE.CylinderGeometry(0.09, 0.08, 0.3, 8);
    forearmGeom.translate(0, -0.15, 0);
    const leftForearm = new THREE.Mesh(forearmGeom, skinMat);
    leftForearm.castShadow = true;
    leftForearmGroup.add(leftForearm);

    // Hand
    const handGeom = new THREE.SphereGeometry(0.09, 8, 8);
    const leftHand = new THREE.Mesh(handGeom, skinMat);
    leftHand.position.set(0, -0.34, 0);
    leftForearmGroup.add(leftHand);

    leftArmGroup.add(leftForearmGroup);
    torsoGroup.add(leftArmGroup);

    // 6. Right Arm Group (Shoulder pivot)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-0.44, 0.26, 0);

    const rightUpperArm = new THREE.Mesh(upperArmGeom, safariJacketMat);
    rightUpperArm.castShadow = true;
    rightArmGroup.add(rightUpperArm);

    const rightForearmGroup = new THREE.Group();
    rightForearmGroup.position.set(0, -0.32, 0);

    const rightForearm = new THREE.Mesh(forearmGeom, skinMat);
    rightForearm.castShadow = true;
    rightForearmGroup.add(rightForearm);

    const rightHand = new THREE.Mesh(handGeom, skinMat);
    rightHand.position.set(0, -0.34, 0);
    rightForearmGroup.add(rightHand);

    rightArmGroup.add(rightForearmGroup);
    torsoGroup.add(rightArmGroup);

    rootGroup.add(torsoGroup);

    // 7. Left Leg Group (Hip pivot)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(0.2, 0.68, 0);

    // Thigh (Shorts)
    const thighGeom = new THREE.CylinderGeometry(0.13, 0.12, 0.34, 8);
    thighGeom.translate(0, -0.17, 0);
    const leftThigh = new THREE.Mesh(thighGeom, shortsMat);
    leftThigh.castShadow = true;
    leftLegGroup.add(leftThigh);

    // Left Calf (Knee pivot)
    const leftCalfGroup = new THREE.Group();
    leftCalfGroup.position.set(0, -0.34, 0);

    const calfGeom = new THREE.CylinderGeometry(0.1, 0.09, 0.32, 8);
    calfGeom.translate(0, -0.16, 0);
    const leftCalf = new THREE.Mesh(calfGeom, skinMat);
    leftCalf.castShadow = true;
    leftCalfGroup.add(leftCalf);

    // Hiking Boot
    const bootGeom = new THREE.BoxGeometry(0.2, 0.18, 0.32);
    bootGeom.translate(0, -0.36, 0.06);
    const leftBoot = new THREE.Mesh(bootGeom, bootMat);
    leftBoot.castShadow = true;
    leftCalfGroup.add(leftBoot);

    leftLegGroup.add(leftCalfGroup);
    rootGroup.add(leftLegGroup);

    // 8. Right Leg Group (Hip pivot)
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-0.2, 0.68, 0);

    const rightThigh = new THREE.Mesh(thighGeom, shortsMat);
    rightThigh.castShadow = true;
    rightLegGroup.add(rightThigh);

    const rightCalfGroup = new THREE.Group();
    rightCalfGroup.position.set(0, -0.34, 0);

    const rightCalf = new THREE.Mesh(calfGeom, skinMat);
    rightCalf.castShadow = true;
    rightCalfGroup.add(rightCalf);

    const rightBoot = new THREE.Mesh(bootGeom, bootMat);
    rightBoot.castShadow = true;
    rightCalfGroup.add(rightBoot);

    rightLegGroup.add(rightCalfGroup);
    rootGroup.add(rightLegGroup);

    return {
      rootGroup,
      torsoGroup,
      headGroup,
      hatGroup,
      backpackGroup,
      leftArmGroup,
      rightArmGroup,
      leftForearmGroup,
      rightForearmGroup,
      leftLegGroup,
      rightLegGroup,
      leftCalfGroup,
      rightCalfGroup,
    };
  }
}
