import * as THREE from 'three';
import { AnimalData } from '../types';

export class ProceduralAnimalFactory {
  constructor() {}

  // 1. Procedural Lion with Fluffy Fur Mane
  public createLion(
    id: string,
    x: number,
    y: number,
    z: number,
    rotation: number = 0,
    furShellCount: number = 4
  ): AnimalData {
    const meshGroup = new THREE.Group();
    meshGroup.position.set(x, y, z);
    meshGroup.rotation.y = rotation;

    // Materials
    const furMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373, // Warm tawny golden
      roughness: 0.75,
      flatShading: true,
    });
    const chestMat = new THREE.MeshStandardMaterial({
      color: 0xfaedcd, // Cream belly/chest
      roughness: 0.8,
      flatShading: true,
    });
    const maneMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Rich brown mane
      roughness: 0.9,
      flatShading: true,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d0c,
      roughness: 0.8,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x263238 });

    // Body Torso
    const bodyGeom = new THREE.BoxGeometry(1.2, 1.1, 2.2);
    const body = new THREE.Mesh(bodyGeom, furMat);
    body.position.y = 1.3;
    body.castShadow = true;
    meshGroup.add(body);

    // Cream Chest
    const chestGeom = new THREE.BoxGeometry(1.0, 0.9, 0.8);
    const chest = new THREE.Mesh(chestGeom, chestMat);
    chest.position.set(0, 1.25, 0.6);
    meshGroup.add(chest);

    // Head Pivot Group
    const headBone = new THREE.Group();
    headBone.position.set(0, 1.85, 1.2);

    const headGeom = new THREE.BoxGeometry(0.75, 0.7, 0.85);
    const head = new THREE.Mesh(headGeom, furMat);
    head.position.set(0, 0, 0.2);
    head.castShadow = true;
    headBone.add(head);

    // Muzzle and Nose
    const muzzleGeom = new THREE.BoxGeometry(0.5, 0.38, 0.45);
    const muzzle = new THREE.Mesh(muzzleGeom, chestMat);
    muzzle.position.set(0, -0.15, 0.7);
    headBone.add(muzzle);

    const noseGeom = new THREE.BoxGeometry(0.2, 0.14, 0.1);
    const nose = new THREE.Mesh(noseGeom, darkMat);
    nose.position.set(0, -0.04, 0.93);
    headBone.add(nose);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.065, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(0.24, 0.12, 0.6);
    headBone.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-0.24, 0.12, 0.6);
    headBone.add(rightEye);

    // Rounded Ears
    const earGeom = new THREE.CylinderGeometry(0.14, 0.12, 0.08, 8);
    earGeom.rotateX(Math.PI / 2);
    const leftEar = new THREE.Mesh(earGeom, furMat);
    leftEar.position.set(0.34, 0.38, 0.1);
    headBone.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, furMat);
    rightEar.position.set(-0.34, 0.38, 0.1);
    headBone.add(rightEar);

    // Fluffy Procedural Mane (Concentric Shells / Volumetric Tufts)
    const maneGroup = new THREE.Group();
    const shells = Math.max(1, furShellCount);
    for (let s = 0; s < shells; s++) {
      const radius = 0.68 + (s / shells) * 0.26;
      const maneGeom = new THREE.DodecahedronGeometry(radius, 1);
      const maneShell = new THREE.Mesh(maneGeom, maneMat);
      maneShell.position.set(0, 0, -0.1);
      maneShell.scale.set(1.2, 1.25, 0.9);
      maneShell.castShadow = true;
      maneGroup.add(maneShell);
    }
    headBone.add(maneGroup);
    meshGroup.add(headBone);

    // Four Muscular Legs
    const legGeom = new THREE.CylinderGeometry(0.18, 0.22, 1.1, 7);
    const pawGeom = new THREE.BoxGeometry(0.32, 0.2, 0.38);

    const legPositions = [
      { x: 0.48, z: 0.8 },
      { x: -0.48, z: 0.8 },
      { x: 0.48, z: -0.8 },
      { x: -0.48, z: -0.8 },
    ];

    const legsBones: THREE.Group[] = [];
    legPositions.forEach((lp) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lp.x, 1.1, lp.z);

      const leg = new THREE.Mesh(legGeom, furMat);
      leg.position.y = -0.45;
      leg.castShadow = true;
      legGroup.add(leg);

      const paw = new THREE.Mesh(pawGeom, chestMat);
      paw.position.set(0, -1.0, 0.08);
      paw.castShadow = true;
      legGroup.add(paw);

      meshGroup.add(legGroup);
      legsBones.push(legGroup);
    });

    // Tail with Fur Tuft Tip
    const tailBone = new THREE.Group();
    tailBone.position.set(0, 1.45, -1.1);

    const tailGeom = new THREE.CylinderGeometry(0.06, 0.08, 1.1, 6);
    tailGeom.translate(0, -0.5, -0.2);
    tailGeom.rotateX(0.4);
    const tail = new THREE.Mesh(tailGeom, furMat);
    tailBone.add(tail);

    const tuftGeom = new THREE.SphereGeometry(0.16, 6, 6);
    const tuft = new THREE.Mesh(tuftGeom, darkMat);
    tuft.position.set(0, -0.9, -0.6);
    tailBone.add(tuft);

    meshGroup.add(tailBone);

    return {
      id,
      type: 'lion',
      name: 'Simba the Lion',
      title: 'King of the Jungle',
      position: new THREE.Vector3(x, y, z),
      rotation,
      meshGroup,
      headBone,
      tailBone,
      legsBones,
      state: 'idle',
      targetLookPos: new THREE.Vector3(),
      wanderTimer: 0,
      reactionTimer: 0,
      spelling: ['L', 'I', 'O', 'N'],
      phonics: '/ˈlaɪ.ən/',
      funFact: 'Lions rest up to 20 hours a day! Their loud roar can be heard 5 miles away.',
      description: 'A magnificent tawny lion with a thick fluffy mane.',
      soundName: 'lion',
    };
  }

  // 2. Procedural Giraffe with Long Neck and Spots
  public createGiraffe(id: string, x: number, y: number, z: number, rotation: number = 0): AnimalData {
    const meshGroup = new THREE.Group();
    meshGroup.position.set(x, y, z);
    meshGroup.rotation.y = rotation;

    const coatMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e1, // Cream coat
      roughness: 0.8,
      flatShading: true,
    });
    const spotMat = new THREE.MeshStandardMaterial({
      color: 0x795548, // Brown giraffe spots
      roughness: 0.85,
      flatShading: true,
    });
    const hoofMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.9,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1b1b1b });

    // Sloping Body
    const bodyGeom = new THREE.BoxGeometry(1.1, 1.2, 1.8);
    const body = new THREE.Mesh(bodyGeom, coatMat);
    body.position.y = 2.4;
    body.rotation.x = -0.15; // Slopes up toward neck
    body.castShadow = true;
    meshGroup.add(body);

    // Procedural Spots on body
    const spotGeom = new THREE.BoxGeometry(0.35, 0.35, 0.05);
    const spotCoords = [
      { x: 0.56, y: 2.5, z: 0.4 },
      { x: 0.56, y: 2.2, z: -0.3 },
      { x: -0.56, y: 2.4, z: 0.2 },
      { x: -0.56, y: 2.6, z: -0.4 },
    ];
    spotCoords.forEach((sc) => {
      const sp = new THREE.Mesh(spotGeom, spotMat);
      sp.position.set(sc.x, sc.y, sc.z);
      meshGroup.add(sp);
    });

    // Tall Slender Legs
    const legGeom = new THREE.CylinderGeometry(0.12, 0.14, 2.2, 6);
    const hoofGeom = new THREE.BoxGeometry(0.24, 0.2, 0.28);
    const legsBones: THREE.Group[] = [];

    const legOffsets = [
      { x: 0.42, z: 0.65 },
      { x: -0.42, z: 0.65 },
      { x: 0.42, z: -0.65 },
      { x: -0.42, z: -0.65 },
    ];

    legOffsets.forEach((lo) => {
      const lg = new THREE.Group();
      lg.position.set(lo.x, 2.1, lo.z);

      const leg = new THREE.Mesh(legGeom, coatMat);
      leg.position.y = -1.0;
      leg.castShadow = true;
      lg.add(leg);

      const hoof = new THREE.Mesh(hoofGeom, hoofMat);
      hoof.position.y = -2.05;
      lg.add(hoof);

      meshGroup.add(lg);
      legsBones.push(lg);
    });

    // Very Long Articulated Neck
    const neckBone = new THREE.Group();
    neckBone.position.set(0, 2.8, 0.7);

    const neckGeom = new THREE.CylinderGeometry(0.28, 0.45, 2.8, 7);
    neckGeom.translate(0, 1.4, 0.3);
    neckGeom.rotateX(0.2);
    const neckMesh = new THREE.Mesh(neckGeom, coatMat);
    neckMesh.castShadow = true;
    neckBone.add(neckMesh);

    // Neck spots
    for (let ns = 0; ns < 4; ns++) {
      const neckSpot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.05), spotMat);
      neckSpot.position.set(0.18, 0.6 + ns * 0.6, 0.4 + ns * 0.12);
      neckBone.add(neckSpot);
    }

    // Head on top of neck
    const headBone = new THREE.Group();
    headBone.position.set(0, 2.9, 0.85);

    const headGeom = new THREE.BoxGeometry(0.48, 0.48, 0.75);
    const headMesh = new THREE.Mesh(headGeom, coatMat);
    headMesh.castShadow = true;
    headBone.add(headMesh);

    // Muzzle
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.42), spotMat);
    muzzle.position.set(0, -0.1, 0.5);
    headBone.add(muzzle);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.06, 6, 6);
    const le = new THREE.Mesh(eyeGeom, eyeMat);
    le.position.set(0.22, 0.12, 0.3);
    headBone.add(le);
    const re = new THREE.Mesh(eyeGeom, eyeMat);
    re.position.set(-0.22, 0.12, 0.3);
    headBone.add(re);

    // Ossicones (Horns)
    const hornGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 5);
    const hornTip = new THREE.SphereGeometry(0.07, 6, 6);

    const lh = new THREE.Mesh(hornGeom, spotMat);
    lh.position.set(0.14, 0.32, -0.05);
    lh.add(new THREE.Mesh(hornTip, spotMat));
    headBone.add(lh);

    const rh = new THREE.Mesh(hornGeom, spotMat);
    rh.position.set(-0.14, 0.32, -0.05);
    rh.add(new THREE.Mesh(hornTip, spotMat));
    headBone.add(rh);

    // Floppy ears
    const earGeom = new THREE.ConeGeometry(0.1, 0.3, 4);
    earGeom.rotateZ(1.2);
    const learm = new THREE.Mesh(earGeom, coatMat);
    learm.position.set(0.32, 0.18, -0.1);
    headBone.add(learm);

    const rearm = new THREE.Mesh(earGeom, coatMat);
    rearm.rotation.y = Math.PI;
    rearm.position.set(-0.32, 0.18, -0.1);
    headBone.add(rearm);

    neckBone.add(headBone);
    meshGroup.add(neckBone);

    // Tail
    const tailBone = new THREE.Group();
    tailBone.position.set(0, 2.2, -0.9);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 5), coatMat);
    tail.position.y = -0.6;
    tailBone.add(tail);
    const tailBrush = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 5), spotMat);
    tailBrush.position.y = -1.25;
    tailBone.add(tailBrush);
    meshGroup.add(tailBone);

    return {
      id,
      type: 'giraffe',
      name: 'Twiga the Giraffe',
      title: 'Tall Canopy Explorer',
      position: new THREE.Vector3(x, y, z),
      rotation,
      meshGroup,
      headBone,
      neckBones: [neckBone],
      tailBone,
      legsBones,
      state: 'idle',
      targetLookPos: new THREE.Vector3(),
      wanderTimer: 0,
      reactionTimer: 0,
      spelling: ['G', 'I', 'R', 'A', 'F', 'F', 'E'],
      phonics: '/dʒəˈræf/',
      funFact: 'Giraffes only need 5 to 30 minutes of sleep in a 24-hour period!',
      description: 'A towering, gentle giraffe with lovely spots and a very long neck.',
      soundName: 'giraffe',
    };
  }

  // 3. Procedural Monkey on a Jungle Rock/Log
  public createMonkey(id: string, x: number, y: number, z: number, rotation: number = 0): AnimalData {
    const meshGroup = new THREE.Group();
    meshGroup.position.set(x, y, z);
    meshGroup.rotation.y = rotation;

    const furMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037, // Rich chestnut fur
      roughness: 0.8,
      flatShading: true,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0xffcc80, // Peach face and ears
      roughness: 0.7,
      flatShading: true,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Perched Base Rock
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.9 }));
    rock.position.y = 0.5;
    rock.scale.set(1.2, 0.8, 1.2);
    meshGroup.add(rock);

    // Torso Group
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 1.1;

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 10), furMat);
    body.scale.set(1.0, 1.25, 0.9);
    body.castShadow = true;
    torsoGroup.add(body);

    // Head Group
    const headBone = new THREE.Group();
    headBone.position.set(0, 0.58, 0.1);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), furMat);
    head.castShadow = true;
    headBone.add(head);

    // Cute Peach Face
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.18), faceMat);
    face.position.set(0, -0.04, 0.22);
    headBone.add(face);

    // Large Round Ears
    const earGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 8);
    earGeom.rotateY(Math.PI / 2);
    const le = new THREE.Mesh(earGeom, faceMat);
    le.position.set(0.34, 0.05, 0);
    headBone.add(le);
    const re = new THREE.Mesh(earGeom, faceMat);
    re.position.set(-0.34, 0.05, 0);
    headBone.add(re);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.045, 6, 6);
    const leye = new THREE.Mesh(eyeGeom, eyeMat);
    leye.position.set(0.11, 0.04, 0.32);
    headBone.add(leye);
    const reye = new THREE.Mesh(eyeGeom, eyeMat);
    reye.position.set(-0.11, 0.04, 0.32);
    headBone.add(reye);

    torsoGroup.add(headBone);

    // Curved Prehensile Tail
    const tailBone = new THREE.Group();
    tailBone.position.set(0, -0.2, -0.32);

    const tailCurve = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
    tailCurve.rotateX(-0.8);
    const t1 = new THREE.Mesh(tailCurve, furMat);
    t1.position.set(0, 0.2, -0.35);
    tailBone.add(t1);

    const tailTip = new THREE.TorusGeometry(0.2, 0.05, 5, 8, Math.PI * 1.3);
    const t2 = new THREE.Mesh(tailTip, furMat);
    t2.position.set(0, 0.45, -0.6);
    tailBone.add(t2);
    torsoGroup.add(tailBone);

    // Flexible Arms
    const armGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.65, 6);
    const leftArm = new THREE.Mesh(armGeom, furMat);
    leftArm.position.set(0.38, 0.1, 0.2);
    leftArm.rotation.z = -0.3;
    leftArm.rotation.x = 0.4;
    torsoGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, furMat);
    rightArm.position.set(-0.38, 0.1, 0.2);
    rightArm.rotation.z = 0.3;
    rightArm.rotation.x = -0.4;
    torsoGroup.add(rightArm);

    meshGroup.add(torsoGroup);

    return {
      id,
      type: 'monkey',
      name: 'Kiki the Monkey',
      title: 'Cheeky Acrobatic Jumper',
      position: new THREE.Vector3(x, y, z),
      rotation,
      meshGroup,
      headBone,
      tailBone,
      state: 'idle',
      targetLookPos: new THREE.Vector3(),
      wanderTimer: 0,
      reactionTimer: 0,
      spelling: ['M', 'O', 'N', 'K', 'E', 'Y'],
      phonics: '/ˈmʌŋ.ki/',
      funFact: 'Monkeys use vocal calls, facial expressions, and body movements to communicate!',
      description: 'A playful brown monkey with big ears and a curling tail, resting on a mossy rock.',
      soundName: 'monkey',
    };
  }

  // 4. Procedural Elephant with Articulated Trunk and Flapping Ears
  public createElephant(id: string, x: number, y: number, z: number, rotation: number = 0): AnimalData {
    const meshGroup = new THREE.Group();
    meshGroup.position.set(x, y, z);
    meshGroup.rotation.y = rotation;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x78909c, // Soft blue-gray elephant skin
      roughness: 0.85,
      flatShading: true,
    });
    const tuskMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Ivory white tusks
      roughness: 0.3,
      metalness: 0.2,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x212121 });
    const nailMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8 });

    // Large Rounded Torso Body
    const bodyGeom = new THREE.BoxGeometry(2.2, 2.0, 3.2);
    const body = new THREE.Mesh(bodyGeom, skinMat);
    body.position.y = 2.4;
    body.castShadow = true;
    meshGroup.add(body);

    // Four Sturdy Pillar Legs
    const legGeom = new THREE.CylinderGeometry(0.38, 0.44, 1.8, 8);
    const toenailGeom = new THREE.SphereGeometry(0.1, 5, 5);

    const legsBones: THREE.Group[] = [];
    const legPositions = [
      { x: 0.85, z: 1.1 },
      { x: -0.85, z: 1.1 },
      { x: 0.85, z: -1.1 },
      { x: -0.85, z: -1.1 },
    ];

    legPositions.forEach((lp) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lp.x, 1.5, lp.z);

      const leg = new THREE.Mesh(legGeom, skinMat);
      leg.position.y = -0.55;
      leg.castShadow = true;
      legGroup.add(leg);

      // Toenails
      for (let tn = 0; tn < 3; tn++) {
        const nail = new THREE.Mesh(toenailGeom, nailMat);
        const a = (tn - 1) * 0.45;
        nail.position.set(Math.sin(a) * 0.36, -1.35, Math.cos(a) * 0.36);
        legGroup.add(nail);
      }

      meshGroup.add(legGroup);
      legsBones.push(legGroup);
    });

    // Head Bone Group
    const headBone = new THREE.Group();
    headBone.position.set(0, 2.8, 1.7);

    const headGeom = new THREE.BoxGeometry(1.4, 1.4, 1.2);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.castShadow = true;
    headBone.add(head);

    // Friendly Eyes
    const eyeGeom = new THREE.SphereGeometry(0.08, 8, 8);
    const le = new THREE.Mesh(eyeGeom, eyeMat);
    le.position.set(0.55, 0.22, 0.5);
    headBone.add(le);

    const re = new THREE.Mesh(eyeGeom, eyeMat);
    re.position.set(-0.55, 0.22, 0.5);
    headBone.add(re);

    // Large Flapping Ears
    const earsBones: THREE.Group[] = [];
    const earShape = new THREE.BoxGeometry(0.12, 1.3, 1.1);

    const leftEar = new THREE.Group();
    leftEar.position.set(0.72, 0.1, -0.1);
    const leftEarMesh = new THREE.Mesh(earShape, skinMat);
    leftEarMesh.position.x = 0.55;
    leftEarMesh.castShadow = true;
    leftEar.add(leftEarMesh);
    headBone.add(leftEar);
    earsBones.push(leftEar);

    const rightEar = new THREE.Group();
    rightEar.position.set(-0.72, 0.1, -0.1);
    const rightEarMesh = new THREE.Mesh(earShape, skinMat);
    rightEarMesh.position.x = -0.55;
    rightEarMesh.castShadow = true;
    rightEar.add(rightEarMesh);
    headBone.add(rightEar);
    earsBones.push(rightEar);

    // White Ivory Curved Tusks
    const tuskGeom = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 7);
    tuskGeom.rotateX(Math.PI / 4);

    const lt = new THREE.Mesh(tuskGeom, tuskMat);
    lt.position.set(0.48, -0.5, 0.8);
    headBone.add(lt);

    const rt = new THREE.Mesh(tuskGeom, tuskMat);
    rt.position.set(-0.48, -0.5, 0.8);
    headBone.add(rt);

    // Articulated Segmented Curved Trunk (3 segments for smooth curling & trumpeting!)
    const trunkBones: THREE.Group[] = [];

    // Segment 1 (Base attached to head)
    const trunkSeg1 = new THREE.Group();
    trunkSeg1.position.set(0, -0.2, 0.65);
    const tMesh1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.7, 7), skinMat);
    tMesh1.position.y = -0.35;
    tMesh1.castShadow = true;
    trunkSeg1.add(tMesh1);
    headBone.add(trunkSeg1);
    trunkBones.push(trunkSeg1);

    // Segment 2 (Mid trunk)
    const trunkSeg2 = new THREE.Group();
    trunkSeg2.position.set(0, -0.7, 0);
    const tMesh2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.7, 7), skinMat);
    tMesh2.position.y = -0.35;
    tMesh2.castShadow = true;
    trunkSeg2.add(tMesh2);
    trunkSeg1.add(trunkSeg2);
    trunkBones.push(trunkSeg2);

    // Segment 3 (Tip of trunk)
    const trunkSeg3 = new THREE.Group();
    trunkSeg3.position.set(0, -0.7, 0);
    const tMesh3 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.6, 7), skinMat);
    tMesh3.position.y = -0.3;
    tMesh3.castShadow = true;
    trunkSeg3.add(tMesh3);
    trunkSeg2.add(trunkSeg3);
    trunkBones.push(trunkSeg3);

    meshGroup.add(headBone);

    // Tail
    const tailBone = new THREE.Group();
    tailBone.position.set(0, 2.5, -1.6);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6), skinMat);
    tail.position.y = -0.6;
    tailBone.add(tail);
    meshGroup.add(tailBone);

    return {
      id,
      type: 'elephant',
      name: 'Tembo the Elephant',
      title: 'Gentle Giant of the Jungle',
      position: new THREE.Vector3(x, y, z),
      rotation,
      meshGroup,
      headBone,
      tailBone,
      earsBones,
      trunkBones,
      legsBones,
      state: 'idle',
      targetLookPos: new THREE.Vector3(),
      wanderTimer: 0,
      reactionTimer: 0,
      spelling: ['E', 'L', 'E', 'P', 'H', 'A', 'N', 'T'],
      phonics: '/ˈel.ə.fənt/',
      funFact: 'An elephant trunk has over 40,000 muscles and can lift up to 700 pounds!',
      description: 'A magnificent gray elephant with grand flapping ears, ivory tusks, and a curved trunk.',
      soundName: 'elephant',
    };
  }
}
