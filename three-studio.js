/**
 * Pure Intensions Mobile Car Wash & Detail
 * Interactive 3D Detailing Bay (Three.js)
 * 100% Procedural & Self-Contained - No external 3D model downloads or CORS issues.
 */

class DetailingStudio3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.carGroup = new THREE.Group();
    this.interiorGroup = new THREE.Group();
    this.wheels = [];
    this.carPaintMeshList = [];
    this.carGlassMeshList = [];
    this.foamParticles = null;
    this.steamParticles = null;
    this.laserBeam = null;
    this.isWashing = false;
    this.isSteamActive = false;
    this.isLaserActive = false;
    this.currentColor = 0x111318; // Obsidian Black default
    this.currentMode = 'standard';
    this.animationFrameId = null;

    // Hotspot positions (local coordinates on car)
    this.hotspots = [
      { id: 'hotspot-hood', pos: new THREE.Vector3(0, 0.95, 1.3), label: 'Exterior Hand Wash & Wax', desc: 'Deionized 0-TDS water & pH-neutral snow foam' },
      { id: 'hotspot-interior', pos: new THREE.Vector3(0.4, 1.1, 0.1), label: 'Deep Interior Steam Clean', desc: '280°F dry steam sanitization of seats & vents' },
      { id: 'hotspot-wheel', pos: new THREE.Vector3(1.05, 0.45, 1.25), label: 'Ceramic Wheel & Caliper', desc: 'Non-acidic iron decontamination & tire dressing' },
      { id: 'hotspot-roof', pos: new THREE.Vector3(0, 1.45, -0.3), label: 'Paint Correction & Ceramic', desc: 'Swirl mark removal & mirror hydrophobic shield' }
    ];

    this.init();
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 550;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.045);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(4.5, 2.2, 4.8);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera from going beneath floor
      this.controls.minDistance = 3.0;
      this.controls.maxDistance = 8.5;
      this.controls.target.set(0, 0.65, 0);
      this.controls.update();
    }

    // 5. Build Environment, Lights & Detailing Bay
    this.buildStudioEnvironment();

    // 6. Build Procedural 3D Car
    this.buildCar();

    // 7. Setup Particle Systems
    this.setupFoamParticles();
    this.setupSteamParticles();
    this.setupLaserScanner();

    // 8. Bind Events & UI
    this.bindEvents();

    // 9. Start Loop
    this.animate = this.animate.bind(this);
    this.animate();

    // Notify ready
    console.log("3D Detailing Bay initialized successfully!");
  }

  buildStudioEnvironment() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c0e14,
      roughness: 0.25,
      metalness: 0.7,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Detailing Bay Circular Spotlight Ring on Floor
    const ringGeo = new THREE.RingGeometry(2.3, 2.38, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4af37, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    this.scene.add(ring);

    // Soft Shadow Disc beneath car
    const shadowGeo = new THREE.PlaneGeometry(4.4, 2.2);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 64, 10, 128, 64, 110);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);
    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.85 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    this.scene.add(shadowPlane);

    // Overhead Studio LED Light Panels (Realistic Car Studio Lighting)
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let z of [-1.5, 0, 1.5]) {
      const ledGeo = new THREE.BoxGeometry(0.08, 0.04, 3.8);
      const ledBar = new THREE.Mesh(ledGeo, ledMat);
      ledBar.position.set(-1.8, 3.2, z);
      this.scene.add(ledBar);

      const ledBarR = ledBar.clone();
      ledBarR.position.x = 1.8;
      this.scene.add(ledBarR);
    }

    // Overhead Center Light Hexagon / Rectangle
    const centerLedGeo = new THREE.BoxGeometry(2.5, 0.05, 4.2);
    const centerLedMat = new THREE.MeshBasicMaterial({ color: 0xfff3db });
    const centerLed = new THREE.Mesh(centerLedGeo, centerLedMat);
    centerLed.position.set(0, 3.5, 0);
    this.scene.add(centerLed);

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Main Studio Spotlights
    const mainSpot = new THREE.SpotLight(0xffffff, 2.5);
    mainSpot.position.set(3, 5, 4);
    mainSpot.angle = Math.PI / 4;
    mainSpot.penumbra = 0.4;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    mainSpot.shadow.bias = -0.001;
    this.scene.add(mainSpot);

    const fillSpot = new THREE.SpotLight(0xd4af37, 1.8);
    fillSpot.position.set(-4, 4.5, -3);
    fillSpot.angle = Math.PI / 3;
    fillSpot.penumbra = 0.5;
    this.scene.add(fillSpot);

    const rearRimLight = new THREE.DirectionalLight(0x99bbff, 1.2);
    rearRimLight.position.set(0, 2.5, -5);
    this.scene.add(rearRimLight);
  }

  buildCar() {
    // Car Body Material: High Clearcoat Glossy Paint
    this.carPaintMaterial = new THREE.MeshPhysicalMaterial({
      color: this.currentColor,
      metalness: 0.85,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.95
    });

    // Glass Material
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111622,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      transparent: true,
      opacity: 0.75,
      reflectivity: 1.0
    });

    // Trim Material (Carbon / Black Satin)
    this.trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.4,
      metalness: 0.6
    });

    // Chrome Material
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.08,
      metalness: 0.95
    });

    // 1. Lower Chassis / Floor
    const chassisGeo = new THREE.BoxGeometry(1.82, 0.22, 4.1);
    const chassis = new THREE.Mesh(chassisGeo, this.trimMaterial);
    chassis.position.set(0, 0.35, 0);
    chassis.castShadow = true;
    this.carGroup.add(chassis);

    // 2. Main Body Shell (Aerodynamic Sculpted Cabin)
    const bodyLowerGeo = new THREE.BoxGeometry(1.88, 0.45, 4.15);
    const bodyLower = new THREE.Mesh(bodyLowerGeo, this.carPaintMaterial);
    bodyLower.position.set(0, 0.58, 0);
    bodyLower.castShadow = true;
    bodyLower.receiveShadow = true;
    this.carGroup.add(bodyLower);
    this.carPaintMeshList.push(bodyLower);

    // 3. Hood (Sloping front)
    const hoodGeo = new THREE.BoxGeometry(1.82, 0.24, 1.35);
    const hood = new THREE.Mesh(hoodGeo, this.carPaintMaterial);
    hood.position.set(0, 0.72, 1.3);
    hood.rotation.x = -0.06;
    hood.castShadow = true;
    this.carGroup.add(hood);
    this.carPaintMeshList.push(hood);

    // 4. Cabin Greenhouse (Upper Cabin Structure)
    const cabinGeo = new THREE.BoxGeometry(1.58, 0.52, 2.1);
    const cabin = new THREE.Mesh(cabinGeo, this.glassMaterial);
    cabin.position.set(0, 1.05, -0.2);
    cabin.castShadow = true;
    this.carGroup.add(cabin);
    this.carGlassMeshList.push(cabin);

    // 5. Roof Panel
    const roofGeo = new THREE.BoxGeometry(1.52, 0.08, 1.6);
    const roof = new THREE.Mesh(roofGeo, this.carPaintMaterial);
    roof.position.set(0, 1.33, -0.25);
    roof.castShadow = true;
    this.carGroup.add(roof);
    this.carPaintMeshList.push(roof);

    // 6. Windshield A-Pillars & Roof Rails
    const pillarLGeo = new THREE.BoxGeometry(0.08, 0.58, 0.08);
    const pillarL = new THREE.Mesh(pillarLGeo, this.trimMaterial);
    pillarL.position.set(-0.76, 1.05, 0.72);
    pillarL.rotation.x = 0.55;
    this.carGroup.add(pillarL);

    const pillarR = pillarL.clone();
    pillarR.position.x = 0.76;
    this.carGroup.add(pillarR);

    // 7. Trunk & Rear Spoiler
    const trunkGeo = new THREE.BoxGeometry(1.78, 0.38, 0.85);
    const trunk = new THREE.Mesh(trunkGeo, this.carPaintMaterial);
    trunk.position.set(0, 0.73, -1.65);
    trunk.castShadow = true;
    this.carGroup.add(trunk);
    this.carPaintMeshList.push(trunk);

    const spoilerGeo = new THREE.BoxGeometry(1.7, 0.05, 0.25);
    const spoiler = new THREE.Mesh(spoilerGeo, this.trimMaterial);
    spoiler.position.set(0, 0.98, -2.02);
    this.carGroup.add(spoiler);

    // 8. Front Grille & Air Intakes
    const grilleGeo = new THREE.BoxGeometry(1.4, 0.25, 0.1);
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.8 });
    const grille = new THREE.Mesh(grilleGeo, grilleMat);
    grille.position.set(0, 0.48, 2.08);
    this.carGroup.add(grille);

    // 9. LED Headlights & Taillight Bar
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x77bbff,
      emissiveIntensity: 1.8
    });
    const headlightLGeo = new THREE.BoxGeometry(0.35, 0.08, 0.12);
    const headlightL = new THREE.Mesh(headlightLGeo, headlightMat);
    headlightL.position.set(-0.7, 0.72, 2.05);
    headlightL.rotation.y = 0.2;
    this.carGroup.add(headlightL);

    const headlightR = headlightL.clone();
    headlightR.position.x = 0.7;
    headlightR.rotation.y = -0.2;
    this.carGroup.add(headlightR);

    // Taillight Continuous LED Bar
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff1122,
      emissive: 0xff0022,
      emissiveIntensity: 2.2
    });
    const taillightGeo = new THREE.BoxGeometry(1.68, 0.07, 0.08);
    const taillight = new THREE.Mesh(taillightGeo, taillightMat);
    taillight.position.set(0, 0.78, -2.07);
    this.carGroup.add(taillight);

    // 10. Wheels & Calipers (4 Corners)
    const wheelPositions = [
      { x: -0.96, y: 0.38, z: 1.25 }, // Front Left
      { x: 0.96, y: 0.38, z: 1.25 },  // Front Right
      { x: -0.96, y: 0.38, z: -1.25 },// Rear Left
      { x: 0.96, y: 0.38, z: -1.25 }  // Rear Right
    ];

    wheelPositions.forEach((pos, idx) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      // Tire (Rubber)
      const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 32);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.85 });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Alloy Rim (Spokes)
      const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.27, 24);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.9, roughness: 0.15 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Center Wheel Cap (Gold Accent)
      const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.28, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.rotation.z = Math.PI / 2;
      wheelGroup.add(cap);

      // Brake Rotor Disc
      const rotorGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24);
      const rotorMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.95, roughness: 0.25 });
      const rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.rotation.z = Math.PI / 2;
      wheelGroup.add(rotor);

      // Red Sport Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.12);
      const caliperMat = new THREE.MeshStandardMaterial({ color: 0xdd1122, roughness: 0.3, metalness: 0.3 });
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(pos.x > 0 ? -0.06 : 0.06, 0.12, 0);
      wheelGroup.add(caliper);

      this.carGroup.add(wheelGroup);
      this.wheels.push(wheelGroup);
    });

    // 11. Interior Elements (Visible through glass or in X-Ray mode)
    // Front Seats
    const seatGeo = new THREE.BoxGeometry(0.48, 0.62, 0.48);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x3a2e24, roughness: 0.6 }); // Saddle Brown Leather
    const seatL = new THREE.Mesh(seatGeo, seatMat);
    seatL.position.set(-0.38, 0.72, -0.15);
    this.interiorGroup.add(seatL);

    const seatR = seatL.clone();
    seatR.position.x = 0.38;
    this.interiorGroup.add(seatR);

    // Dashboard & Center Console
    const dashGeo = new THREE.BoxGeometry(1.4, 0.25, 0.45);
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x141417, roughness: 0.5 });
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(0, 0.82, 0.45);
    this.interiorGroup.add(dash);

    // Steering Wheel
    const wheelTorusGeo = new THREE.TorusGeometry(0.14, 0.025, 12, 24);
    const steerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const steeringWheel = new THREE.Mesh(wheelTorusGeo, steerMat);
    steeringWheel.position.set(-0.38, 0.92, 0.28);
    steeringWheel.rotation.x = -0.4;
    this.interiorGroup.add(steeringWheel);

    this.carGroup.add(this.interiorGroup);

    // Add Car to Scene
    this.scene.add(this.carGroup);
  }

  /* Particle System 1: Snow Foam Cannon Particles */
  setupFoamParticles() {
    const particleCount = 450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.2;
      positions[i * 3 + 1] = 0.6 + Math.random() * 0.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4.0;

      velocities.push({
        y: -0.015 - Math.random() * 0.02,
        x: (Math.random() - 0.5) * 0.005,
        z: (Math.random() - 0.5) * 0.005
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Circle Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.14,
      map: tex,
      transparent: true,
      opacity: 0,
      color: 0xffffff,
      depthWrite: false
    });

    this.foamParticles = new THREE.Points(geometry, material);
    this.foamParticles.velocities = velocities;
    this.scene.add(this.foamParticles);
  }

  /* Particle System 2: Interior Steam Sanitization */
  setupSteamParticles() {
    const steamCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(steamCount * 3);
    const vels = [];

    for (let i = 0; i < steamCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.2;
      positions[i * 3 + 1] = 0.65 + Math.random() * 0.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;

      vels.push({
        y: 0.008 + Math.random() * 0.01,
        x: (Math.random() - 0.5) * 0.004,
        z: (Math.random() - 0.5) * 0.004
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 14);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.22,
      map: tex,
      transparent: true,
      opacity: 0,
      color: 0xffe8c0,
      depthWrite: false
    });

    this.steamParticles = new THREE.Points(geometry, material);
    this.steamParticles.vels = vels;
    this.scene.add(this.steamParticles);
  }

  /* Laser Scanner for Paint Correction */
  setupLaserScanner() {
    const laserGeo = new THREE.BoxGeometry(2.4, 0.02, 0.08);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0
    });
    this.laserBeam = new THREE.Mesh(laserGeo, laserMat);
    this.laserBeam.position.set(0, 0.85, -2.1);
    this.scene.add(this.laserBeam);
  }

  /* Set Detailing Mode */
  setMode(mode) {
    this.currentMode = mode;

    // Reset particle states
    if (this.foamParticles) this.foamParticles.material.opacity = 0;
    if (this.steamParticles) this.steamParticles.material.opacity = 0;
    if (this.laserBeam) this.laserBeam.material.opacity = 0;
    this.isWashing = false;
    this.isSteamActive = false;
    this.isLaserActive = false;

    // Restore standard glass & paint opacity
    this.glassMaterial.opacity = 0.75;
    this.carPaintMeshList.forEach(m => m.material.opacity = 1.0);

    const statusBadge = document.getElementById('studio-status-badge');
    const modeDesc = document.getElementById('studio-mode-description');

    switch (mode) {
      case 'wash':
        this.isWashing = true;
        this.foamParticles.material.opacity = 0.85;
        this.animateCameraTo(3.8, 1.8, 3.8);
        if (statusBadge) statusBadge.textContent = "Active: Snow Foam Wash & Rinse";
        if (modeDesc) modeDesc.textContent = "Simulating dense deionized snow foam pre-soak and spot-free rinse on body panels.";
        break;

      case 'interior':
        this.isSteamActive = true;
        this.steamParticles.material.opacity = 0.75;
        // Make exterior glass more transparent to reveal cockpit
        this.glassMaterial.opacity = 0.25;
        this.animateCameraTo(1.6, 1.7, 1.5);
        if (statusBadge) statusBadge.textContent = "Active: 280°F Interior Steam Sanitization";
        if (modeDesc) modeDesc.textContent = "Deep steam pore sterilization lifting spills from leather seats, dash, and AC ductwork.";
        break;

      case 'ceramic':
        this.isLaserActive = true;
        this.laserBeam.material.opacity = 0.95;
        this.animateCameraTo(2.8, 1.9, 3.4);
        // Boost paint shine
        this.carPaintMaterial.clearcoat = 1.0;
        this.carPaintMaterial.roughness = 0.05;
        if (statusBadge) statusBadge.textContent = "Active: Mirror Gloss & Swirl Removal";
        if (modeDesc) modeDesc.textContent = "Multi-stage rotary polish eliminating micro-swirls for high-depth optical reflection.";
        break;

      case 'wheel':
        this.animateCameraTo(1.8, 0.75, 1.9);
        if (statusBadge) statusBadge.textContent = "Active: Wheel & Caliper Ceramic Detail";
        if (modeDesc) modeDesc.textContent = "Non-acidic iron decontamination removing brake dust, finished with satin tire dressing.";
        break;

      case 'standard':
      default:
        this.animateCameraTo(4.5, 2.2, 4.8);
        if (statusBadge) statusBadge.textContent = "3D Interactive Detailing Bay";
        if (modeDesc) modeDesc.textContent = "Drag to rotate 360° • Pinch or scroll to zoom • Click hotspots to inspect detailing treatments.";
        break;
    }
  }

  /* Set Car Paint Color */
  setPaintColor(hexColor) {
    this.currentColor = hexColor;
    if (this.carPaintMaterial) {
      this.carPaintMaterial.color.setHex(hexColor);
    }
  }

  /* Smooth Camera Animation */
  animateCameraTo(x, y, z) {
    if (!this.camera) return;
    const startPos = this.camera.position.clone();
    const targetPos = new THREE.Vector3(x, y, z);
    const duration = 1000;
    const startTime = performance.now();

    const animateCam = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, targetPos, ease);
      if (this.controls) this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateCam);
      }
    };
    requestAnimationFrame(animateCam);
  }

  /* Update 2D Hotspot Screen Coordinates */
  updateHotspots() {
    if (!this.camera || !this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.hotspots.forEach(spot => {
      const el = document.getElementById(spot.id);
      if (!el) return;

      // Project 3D coordinate to 2D screen space
      const worldPos = spot.pos.clone().applyMatrix4(this.carGroup.matrixWorld);
      const screenPos = worldPos.project(this.camera);

      // Check if behind camera
      if (screenPos.z > 1) {
        el.style.display = 'none';
        return;
      }

      const x = (screenPos.x * 0.5 + 0.5) * width;
      const y = (-(screenPos.y * 0.5) + 0.5) * height;

      el.style.display = 'block';
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    });
  }

  /* Event Bindings for Canvas & UI controls */
  bindEvents() {
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    // Color Swatches
    const colorSwatches = document.querySelectorAll('.color-swatch-btn');
    colorSwatches.forEach(btn => {
      btn.addEventListener('click', () => {
        colorSwatches.forEach(b => b.classList.remove('ring-2', 'ring-yellow-400', 'scale-110'));
        btn.classList.add('ring-2', 'ring-yellow-400', 'scale-110');
        const hex = parseInt(btn.dataset.color, 16);
        this.setPaintColor(hex);
      });
    });

    // Mode Buttons
    const modeButtons = document.querySelectorAll('.studio-mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => {
          b.classList.remove('bg-yellow-500', 'text-black', 'font-bold');
          b.classList.add('bg-slate-900', 'text-slate-300');
        });
        btn.classList.add('bg-yellow-500', 'text-black', 'font-bold');
        btn.classList.remove('bg-slate-900', 'text-slate-300');

        const mode = btn.dataset.mode;
        this.setMode(mode);
      });
    });

    // Hotspot button clicks
    this.hotspots.forEach(spot => {
      const el = document.getElementById(spot.id);
      if (el) {
        el.addEventListener('click', () => {
          this.focusHotspot(spot);
        });
      }
    });

    // Reset Camera button
    const resetBtn = document.getElementById('studio-reset-cam-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.setMode('standard');
      });
    }
  }

  focusHotspot(spot) {
    if (spot.id === 'hotspot-hood') {
      this.setMode('wash');
    } else if (spot.id === 'hotspot-interior') {
      this.setMode('interior');
    } else if (spot.id === 'hotspot-wheel') {
      this.setMode('wheel');
    } else if (spot.id === 'hotspot-roof') {
      this.setMode('ceramic');
    }
  }

  /* Main Animation Loop */
  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Subtle gentle auto-spin when idle in standard mode
    if (this.currentMode === 'standard' && this.controls && !this.controls.state) {
      this.carGroup.rotation.y += 0.003;
    }

    // 1. Foam Particle Animation
    if (this.isWashing && this.foamParticles) {
      const positions = this.foamParticles.geometry.attributes.position.array;
      const vels = this.foamParticles.velocities;

      for (let i = 0; i < vels.length; i++) {
        positions[i * 3 + 1] += vels[i].y;
        positions[i * 3] += vels[i].x;
        positions[i * 3 + 2] += vels[i].z;

        // Reset if reached floor
        if (positions[i * 3 + 1] < 0.2) {
          positions[i * 3 + 1] = 1.3 + Math.random() * 0.4;
          positions[i * 3] = (Math.random() - 0.5) * 1.8;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 3.8;
        }
      }
      this.foamParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Steam Particle Animation
    if (this.isSteamActive && this.steamParticles) {
      const pos = this.steamParticles.geometry.attributes.position.array;
      const vels = this.steamParticles.vels;

      for (let i = 0; i < vels.length; i++) {
        pos[i * 3 + 1] += vels[i].y;
        pos[i * 3] += vels[i].x;
        pos[i * 3 + 2] += vels[i].z;

        if (pos[i * 3 + 1] > 1.6) {
          pos[i * 3 + 1] = 0.65;
          pos[i * 3] = (Math.random() - 0.5) * 1.1;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        }
      }
      this.steamParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Laser Scanner Sweep Animation
    if (this.isLaserActive && this.laserBeam) {
      this.laserBeam.position.z += 0.045;
      if (this.laserBeam.position.z > 2.1) {
        this.laserBeam.position.z = -2.1;
      }
    }

    // 4. Update Orbit Controls
    if (this.controls) {
      this.controls.update();
    }

    // 5. Update 3D Hotspot Screen Coordinates
    this.updateHotspots();

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Auto-instantiate when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('three-car-container')) {
    window.pureIntensionsStudio3D = new DetailingStudio3D('three-car-container');
  }
});
