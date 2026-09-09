/**
 * Campus-Nexus 3D — Core WebGL Engine & Spatial Controller
 * Powered by Three.js & GSAP
 * 
 * Features:
 * - High-fidelity outdoor campus environment (Ground, Pathways, Water, Trees, Lighting)
 * - 8 Unique procedural architectural buildings with dynamic emissives
 * - Smooth GSAP cinematic camera navigation
 * - Precision raycasting with hover outlines & 3D screen-projected tooltips
 * - Plug-and-play GLTFLoader hook for custom Blender campus models
 * - Dynamic Day / Sunset / Night atmospheric transitions
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { campusBuildings, cameraPresets, environmentThemes } from './campusData.js';

// Ensure GSAP reference (support global or module)
const gsap = window.gsap;

class CampusNexusApp {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingFill = document.getElementById('loading-bar-fill');
    this.loadingPct = document.getElementById('loading-pct');

    // UI Elements
    this.tooltip = document.getElementById('hover-tooltip');
    this.tooltipBadge = document.getElementById('tooltip-badge');
    this.tooltipTitle = document.getElementById('tooltip-title');
    this.drawer = document.getElementById('building-drawer');
    this.searchInput = document.getElementById('campus-search-input');
    this.searchDropdown = document.getElementById('search-dropdown');
    this.searchClearBtn = document.getElementById('search-clear-btn');
    this.quickDock = document.getElementById('quick-dock');
    this.resetBtn = document.getElementById('reset-view-btn');

    // Three.js Core Components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Lighting References for Theme Transitions
    this.sunLight = null;
    this.hemiLight = null;
    this.fillLight = null;
    this.currentTheme = 'day';

    // Spatial & Interactive Collections
    this.proceduralCampusGroup = new THREE.Group();
    this.interactiveMeshes = [];
    this.buildingMeshMap = new Map(); // id -> primary mesh
    this.beacons = []; // Animated floating pins
    this.pulseRings = []; // Pulsing ground rings
    this.waterMesh = null;
    this.customModelGroup = null;

    // Raycaster State
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-1000, -1000);
    this.hoveredMesh = null;
    this.selectedBuilding = null;
    this.isTransitioning = false;

    // Initialize Application
    this.init();
  }

  async init() {
    this.updateLoading(20, 'Configuring Scene & Camera...');
    this.setupScene();

    this.updateLoading(45, 'Synthesizing Atmospheric Lighting...');
    this.setupLighting();

    this.updateLoading(70, 'Generating Procedural Campus Infrastructure...');
    this.generateCampusEnvironment();

    this.updateLoading(90, 'Binding Spatial Interactivity & HUD...');
    this.setupControls();
    this.setupRaycasting();
    this.setupUIEvents();

    // Responsive Canvas Resize Listener
    window.addEventListener('resize', () => this.onWindowResize(), false);

    this.updateLoading(100, 'Ready to Explore');
    setTimeout(() => {
      this.hideLoadingScreen();
    }, 400);

    // Start Animation Loop
    this.animate();
  }

  /* ========================================================================
     Scene, Camera & Renderer Setup
     ======================================================================== */
  setupScene() {
    this.scene = new THREE.Scene();
    const initialTheme = environmentThemes[this.currentTheme];

    this.scene.background = new THREE.Color(initialTheme.skyColor);
    this.scene.fog = new THREE.Fog(
      initialTheme.fogColor,
      initialTheme.fogNear,
      initialTheme.fogFar
    );

    // Perspective Camera
    this.camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    const initialCam = cameraPresets.overview.camera;
    this.camera.position.set(initialCam.x, initialCam.y, initialCam.z);

    // High-Performance WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  /* ========================================================================
     Realistic Outdoor Lighting System
     ======================================================================== */
  setupLighting() {
    const theme = environmentThemes[this.currentTheme];

    // Hemisphere Light (Sky ambient bounce)
    this.hemiLight = new THREE.HemisphereLight(
      theme.hemiSky,
      theme.hemiGround,
      theme.hemiIntensity
    );
    this.hemiLight.position.set(0, 100, 0);
    this.scene.add(this.hemiLight);

    // Directional Sunlight with Soft Shadows
    this.sunLight = new THREE.DirectionalLight(
      theme.sunColor,
      theme.sunIntensity
    );
    this.sunLight.position.set(
      theme.sunPosition.x,
      theme.sunPosition.y,
      theme.sunPosition.z
    );
    this.sunLight.castShadow = true;

    // Shadow Frustum Optimization for Campus Scale
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 280;
    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0004;

    this.scene.add(this.sunLight);

    // Fill Light (Secondary cool illumination for contrast)
    this.fillLight = new THREE.DirectionalLight(
      theme.fillColor,
      theme.fillIntensity
    );
    this.fillLight.position.set(-60, 45, -50);
    this.scene.add(this.fillLight);
  }

  /* ========================================================================
     OrbitControls with Damping & Ground Clamping
     ======================================================================== */
  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;

    // Clamp polar angle so camera never clips beneath the ground plane
    this.controls.maxPolarAngle = Math.PI / 2.08;
    this.controls.minPolarAngle = Math.PI / 8;

    // Clamp Zoom Distances
    this.controls.minDistance = 14;
    this.controls.maxDistance = 210;

    const initialTarget = cameraPresets.overview.target;
    this.controls.target.set(initialTarget.x, initialTarget.y, initialTarget.z);
    this.controls.update();
  }

  /* ========================================================================
     Procedural University Campus Generator (Ground, Roads, Buildings, Trees)
     ======================================================================== */
  generateCampusEnvironment() {
    this.scene.add(this.proceduralCampusGroup);

    // 1. Lush Campus Terrain & Perimeter
    const terrainGeo = new THREE.PlaneGeometry(360, 360, 32, 32);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x1f382b, // Lush grass emerald
      roughness: 0.9,
      metalness: 0.1
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    this.proceduralCampusGroup.add(terrain);

    // Campus Core Pedestrian Plaza Slab
    const plazaGeo = new THREE.CylinderGeometry(85, 90, 0.4, 48);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x273549, // Slate stone
      roughness: 0.85,
      metalness: 0.15
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = 0.2;
    plaza.receiveShadow = true;
    this.proceduralCampusGroup.add(plaza);

    // 2. Central Reflecting Pool / Water Body
    const waterGeo = new THREE.CylinderGeometry(14, 14, 0.5, 36);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(0, 0.35, -5);
    this.waterMesh.receiveShadow = true;
    this.proceduralCampusGroup.add(this.waterMesh);

    // Water Pool Stone Coping Rim
    const waterRimGeo = new THREE.TorusGeometry(14.2, 0.5, 8, 36);
    waterRimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
    const waterRim = new THREE.Mesh(waterRimGeo, rimMat);
    waterRim.position.set(0, 0.6, -5);
    this.proceduralCampusGroup.add(waterRim);

    // 3. Road & Boulevard Network
    this.generatePathways();

    // 4. Procedural Buildings Architecture
    campusBuildings.forEach((bData) => {
      this.createProceduralBuilding(bData);
    });

    // 5. Campus Foliage & Trees
    this.generateCampusTrees();

    // 6. Street Lamps & Decorative Details
    this.generateCampusStreetLamps();
  }

  /* Road & Boulevard Network Generator */
  generatePathways() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85
    });
    const walkMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8
    });

    // Main Ceremonial South Boulevard (Entrance to Central Quad)
    const southBlvdGeo = new THREE.PlaneGeometry(16, 75);
    southBlvdGeo.rotateX(-Math.PI / 2);
    const southBlvd = new THREE.Mesh(southBlvdGeo, roadMat);
    southBlvd.position.set(0, 0.22, 40);
    southBlvd.receiveShadow = true;
    this.proceduralCampusGroup.add(southBlvd);

    // East-West Academic Connector Arteries
    const ewRoadGeo = new THREE.PlaneGeometry(150, 10);
    ewRoadGeo.rotateX(-Math.PI / 2);
    const ewRoad = new THREE.Mesh(ewRoadGeo, walkMat);
    ewRoad.position.set(0, 0.23, -16);
    ewRoad.receiveShadow = true;
    this.proceduralCampusGroup.add(ewRoad);

    // North-South Heritage Walkway
    const nsWalkGeo = new THREE.PlaneGeometry(10, 80);
    nsWalkGeo.rotateX(-Math.PI / 2);
    const nsWalk = new THREE.Mesh(nsWalkGeo, walkMat);
    nsWalk.position.set(0, 0.23, -40);
    nsWalk.receiveShadow = true;
    this.proceduralCampusGroup.add(nsWalk);

    // Diagonal Pathway Connections
    const diagMat = walkMat.clone();
    const diag1Geo = new THREE.PlaneGeometry(8, 60);
    diag1Geo.rotateX(-Math.PI / 2);
    diag1Geo.rotateY(Math.PI / 4);
    const diag1 = new THREE.Mesh(diag1Geo, diagMat);
    diag1.position.set(-28, 0.23, 10);
    diag1.receiveShadow = true;
    this.proceduralCampusGroup.add(diag1);

    const diag2Geo = new THREE.PlaneGeometry(8, 60);
    diag2Geo.rotateX(-Math.PI / 2);
    diag2Geo.rotateY(-Math.PI / 4);
    const diag2 = new THREE.Mesh(diag2Geo, diagMat);
    diag2.position.set(28, 0.23, 10);
    diag2.receiveShadow = true;
    this.proceduralCampusGroup.add(diag2);
  }

  /* Procedural Building Architectural Synthesizer */
  createProceduralBuilding(bData) {
    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(bData.coordinates.x, 0, bData.coordinates.z);

    const { width, height, depth } = bData.dimensions;

    // Palette per category
    const mainColor = new THREE.Color(bData.tagColor).lerp(new THREE.Color(0x1e293b), 0.65);
    const glassColor = new THREE.Color(bData.tagColor).lerp(new THREE.Color(0xdbeafe), 0.5);

    // Building Base Podium
    const baseGeo = new THREE.BoxGeometry(width + 2, 0.8, depth + 2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.4;
    baseMesh.receiveShadow = true;
    buildingGroup.add(baseMesh);

    let primaryMesh = null;

    // Architectural Style Diversification
    if (bData.id === 'library') {
      // Modern Glass Prism with Tiered Cantilevers
      const coreGeo = new THREE.BoxGeometry(width, height, depth);
      const coreMat = new THREE.MeshStandardMaterial({
        color: mainColor,
        roughness: 0.2,
        metalness: 0.35
      });
      primaryMesh = new THREE.Mesh(coreGeo, coreMat);
      primaryMesh.position.y = height / 2 + 0.8;
      primaryMesh.castShadow = true;
      primaryMesh.receiveShadow = true;
      buildingGroup.add(primaryMesh);

      // Glass Curtain Wall Facade Strip
      const curtainGeo = new THREE.BoxGeometry(width * 0.9, height * 0.7, depth + 0.6);
      const glassMat = new THREE.MeshStandardMaterial({
        color: glassColor,
        roughness: 0.1,
        metalness: 0.85,
        emissive: new THREE.Color(bData.tagColor),
        emissiveIntensity: 0.15
      });
      const curtainMesh = new THREE.Mesh(curtainGeo, glassMat);
      curtainMesh.position.y = height * 0.48 + 0.8;
      buildingGroup.add(curtainMesh);

      // Rooftop Skylight Box
      const skylightGeo = new THREE.BoxGeometry(width * 0.5, 2, depth * 0.5);
      const skylight = new THREE.Mesh(skylightGeo, glassMat);
      skylight.position.y = height + 1.8;
      buildingGroup.add(skylight);

    } else if (bData.id === 'turing') {
      // High-Tech Cyber Block with Staggered Modules & Antenna
      const coreGeo = new THREE.BoxGeometry(width, height, depth);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.3,
        metalness: 0.5
      });
      primaryMesh = new THREE.Mesh(coreGeo, coreMat);
      primaryMesh.position.y = height / 2 + 0.8;
      primaryMesh.castShadow = true;
      primaryMesh.receiveShadow = true;
      buildingGroup.add(primaryMesh);

      // Horizontal Glowing Window Strips
      for (let f = 1; f < bData.floors; f++) {
        const stripGeo = new THREE.BoxGeometry(width + 0.3, 0.7, depth + 0.3);
        const stripMat = new THREE.MeshStandardMaterial({
          color: 0x818cf8,
          emissive: 0x6366f1,
          emissiveIntensity: 0.45
        });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.y = (height / bData.floors) * f + 0.8;
        buildingGroup.add(strip);
      }

      // Roof Tech Array & Rotating Antenna
      const roofEquipGeo = new THREE.CylinderGeometry(1.2, 1.2, 4, 16);
      const roofEquipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const antenna = new THREE.Mesh(roofEquipGeo, roofEquipMat);
      antenna.position.set(3, height + 2.8, -3);
      buildingGroup.add(antenna);

      const dishGeo = new THREE.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9 });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.set(3, height + 4.8, -3);
      dish.rotation.x = Math.PI / 3;
      buildingGroup.add(dish);

    } else if (bData.id === 'arena') {
      // Aerodynamic Curved Sports Dome
      const domeGeo = new THREE.SphereGeometry(width * 0.65, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.25,
        metalness: 0.4
      });
      primaryMesh = new THREE.Mesh(domeGeo, domeMat);
      primaryMesh.scale.set(1, 0.55, 1.25);
      primaryMesh.position.y = 0.8;
      primaryMesh.castShadow = true;
      primaryMesh.receiveShadow = true;
      buildingGroup.add(primaryMesh);

      // Surrounding Glazed Base Ring
      const ringWallGeo = new THREE.CylinderGeometry(width * 0.64, width * 0.64, 4, 32);
      const ringWallMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.9
      });
      const ringWall = new THREE.Mesh(ringWallGeo, ringWallMat);
      ringWall.position.y = 2.8;
      buildingGroup.add(ringWall);

    } else if (bData.id === 'auditorium') {
      // Sculptural Fan-Shaped Concert Hall
      const hallGeo = new THREE.CylinderGeometry(width * 0.6, width * 0.45, height, 6);
      const hallMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.35,
        metalness: 0.3
      });
      primaryMesh = new THREE.Mesh(hallGeo, hallMat);
      primaryMesh.position.y = height / 2 + 0.8;
      primaryMesh.rotation.y = Math.PI / 6;
      primaryMesh.castShadow = true;
      primaryMesh.receiveShadow = true;
      buildingGroup.add(primaryMesh);

      // Angled Copper Entrance Shell
      const shellGeo = new THREE.BoxGeometry(width * 0.7, 4, depth * 0.6);
      shellGeo.rotateZ(Math.PI / 12);
      const shellMat = new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        roughness: 0.4,
        metalness: 0.6
      });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      shell.position.set(0, height * 0.7, depth * 0.3);
      buildingGroup.add(shell);

    } else if (bData.id === 'admin') {
      // Neoclassical Symmetrical Wings with Clock Tower
      const mainBlockGeo = new THREE.BoxGeometry(width, height * 0.75, depth * 0.8);
      const adminMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.6,
        metalness: 0.2
      });
      primaryMesh = new THREE.Mesh(mainBlockGeo, adminMat);
      primaryMesh.position.y = (height * 0.75) / 2 + 0.8;
      primaryMesh.castShadow = true;
      primaryMesh.receiveShadow = true;
      buildingGroup.add(primaryMesh);

      // Center Clock Tower Spire
      const towerGeo = new THREE.BoxGeometry(6, height + 8, 6);
      const tower = new THREE.Mesh(towerGeo, adminMat);
      tower.position.y = (height + 8) / 2 + 0.8;
      tower.castShadow = true;
      buildingGroup.add(tower);

      // Clock Dial (Emissive)
      const dialGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.4, 16);
      dialGeo.rotateX(Math.PI / 2);
      const dialMat = new THREE.MeshStandardMaterial({
        color: 0xffedd5,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.8
      });
      const dial = new THREE.Mesh(dialGeo, dialMat);
      dial.position.set(0, height + 6, 3.2);
      buildingGroup.add(dial);

      // Tower Pyramid Roof
      const spireGeo = new THREE.ConeGeometry(4.2, 5, 4);
      spireGeo.rotateY(Math.PI / 4);
      const spireMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5 });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.y = height + 11.2;
      buildingGroup.add(spire);

    } else if (bData.id === 'gate') {
      // Grand Memorial Monumental Arch
      const archGroup = new THREE.Group();
      const p1Geo = new THREE.BoxGeometry(4, height, 4);
      const pMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, metalness: 0.3 });
      const p1 = new THREE.Mesh(p1Geo, pMat);
      p1.position.set(-8, height / 2 + 0.8, 0);

      const p2 = new THREE.Mesh(p1Geo, pMat);
      p2.position.set(8, height / 2 + 0.8, 0);

      const lintelGeo = new THREE.BoxGeometry(22, 2.5, 4.5);
      const lintel = new THREE.Mesh(lintelGeo, pMat);
      lintel.position.set(0, height + 1.2, 0);

      archGroup.add(p1, p2, lintel);
      archGroup.castShadow = true;
      buildingGroup.add(archGroup);
      primaryMesh = p1; // reference for raycasting

    } else {
      // Standard Contemporary Multi-Level Building (The Hive / Biotech)
      const boxGeo = new THREE.BoxGeometry(width, height, depth);
      const boxMat = new THREE.MeshStandardMaterial({
        color: mainColor,
        roughness: 0.4,
        metalness: 0.25
      });
      primaryMesh = new THREE.Mesh(boxGeo, boxMat);
      primaryMesh.position.y = height / 2 + 0.8;
      primaryMesh.castShadow = true;
      primaryMesh.receiveShadow = true;
      buildingGroup.add(primaryMesh);

      // Rooftop Greenhouse or Garden Canopy
      const roofDeckGeo = new THREE.BoxGeometry(width * 0.8, 1.5, depth * 0.8);
      const deckMat = new THREE.MeshStandardMaterial({
        color: bData.id === 'hive' ? 0x22c55e : 0xa855f7,
        emissive: new THREE.Color(bData.tagColor),
        emissiveIntensity: 0.2
      });
      const roofDeck = new THREE.Mesh(roofDeckGeo, deckMat);
      roofDeck.position.y = height + 1.5;
      buildingGroup.add(roofDeck);
    }

    // Attach Interactivity Metadata
    primaryMesh.userData = {
      buildingData: bData,
      isInteractive: true,
      originalEmissive: primaryMesh.material.emissive
        ? primaryMesh.material.emissive.clone()
        : new THREE.Color(0x000000),
      originalColor: primaryMesh.material.color.clone()
    };

    this.interactiveMeshes.push(primaryMesh);
    this.buildingMeshMap.set(bData.id, primaryMesh);

    // 7. Floating 3D Beacon Pin & Pulsing Ground Ring
    this.createBuildingMarker(bData, buildingGroup, height);

    this.proceduralCampusGroup.add(buildingGroup);
  }

  /* 3D Floating Beacon Pin & Ground Ripple Marker */
  createBuildingMarker(bData, group, height) {
    const beaconColor = new THREE.Color(bData.tagColor);

    // Floating Gem Beacon
    const gemGeo = new THREE.OctahedronGeometry(1.2, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: beaconColor,
      emissive: beaconColor,
      emissiveIntensity: 0.8,
      metalness: 0.2,
      roughness: 0.1
    });
    const beaconMesh = new THREE.Mesh(gemGeo, gemMat);
    beaconMesh.position.set(0, height + 4.5, 0);

    // Beacon glow light
    const beaconLight = new THREE.PointLight(beaconColor, 0.4, 20);
    beaconLight.position.set(0, height + 4.5, 0);
    group.add(beaconLight);

    beaconMesh.userData = {
      baseY: height + 4.5,
      phase: Math.random() * Math.PI * 2
    };
    group.add(beaconMesh);
    this.beacons.push(beaconMesh);

    // Pulsing Ground Ring
    const ringGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: beaconColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 0.25, 0);
    group.add(ringMesh);

    this.pulseRings.push({
      mesh: ringMesh,
      maxScale: 2.8,
      speed: 0.015 + Math.random() * 0.005,
      currentProgress: Math.random()
    });
  }

  /* Stylized Low-Poly Campus Trees */
  generateCampusTrees() {
    const treeGroup = new THREE.Group();

    // Reusable Materials
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const foliageMat3 = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.8 });

    const foliageColors = [foliageMat1, foliageMat2, foliageMat3];

    // Tree positions scattered along pathways and park areas
    const treeCoords = [
      // South Boulevard Tree Lines
      { x: -10, z: 20 }, { x: 10, z: 20 },
      { x: -10, z: 35 }, { x: 10, z: 35 },
      { x: -10, z: 50 }, { x: 10, z: 50 },
      { x: -10, z: 65 }, { x: 10, z: 65 },

      // Central Quad Lawn Clusters
      { x: -14, z: -4 }, { x: 14, z: -4 },
      { x: -20, z: 4 }, { x: 20, z: 4 },
      { x: -12, z: 12 }, { x: 12, z: 12 },
      { x: -6, z: -22 }, { x: 6, z: -22 },

      // Library Park Grove
      { x: -44, z: -10 }, { x: -42, z: -25 },
      { x: -18, z: -30 }, { x: -32, z: -35 },

      // Engineering Quad
      { x: 42, z: -10 }, { x: 44, z: -28 },
      { x: 18, z: -32 }, { x: 34, z: -36 },

      // Auditorium & Arts Perimeter
      { x: -62, z: 8 }, { x: -64, z: 26 },
      { x: -38, z: 35 }, { x: -55, z: 34 },

      // Sports Arena Perimeter
      { x: 66, z: 10 }, { x: 68, z: 32 },
      { x: 38, z: 38 }, { x: 54, z: 42 },

      // North Forest & Heritage Grove
      { x: -18, z: -64 }, { x: 18, z: -64 },
      { x: -2, z: -68 }, { x: -30, z: -68 },
      { x: 30, z: -68 }, { x: -50, z: -55 },
      { x: 50, z: -55 }
    ];

    treeCoords.forEach((coord) => {
      const singleTree = new THREE.Group();
      singleTree.position.set(coord.x, 0, coord.z);

      const heightScale = 0.8 + Math.random() * 0.45;
      singleTree.scale.set(heightScale, heightScale, heightScale);

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 2.8, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.4;
      trunk.castShadow = true;
      singleTree.add(trunk);

      // Foliage (Tiered Cones or Spheres)
      const mat = foliageColors[Math.floor(Math.random() * foliageColors.length)];
      const isConifer = Math.random() > 0.4;

      if (isConifer) {
        // Pine Tree (3 layered cones)
        for (let i = 0; i < 3; i++) {
          const coneGeo = new THREE.ConeGeometry(2.4 - i * 0.5, 2.6, 6);
          const cone = new THREE.Mesh(coneGeo, mat);
          cone.position.y = 3.2 + i * 1.6;
          cone.castShadow = true;
          singleTree.add(cone);
        }
      } else {
        // Deciduous Tree (Fluffy dodecahedron cluster)
        const crownGeo = new THREE.DodecahedronGeometry(2.2, 1);
        const crown = new THREE.Mesh(crownGeo, mat);
        crown.position.y = 3.8;
        crown.castShadow = true;
        singleTree.add(crown);
      }

      treeGroup.add(singleTree);
    });

    this.proceduralCampusGroup.add(treeGroup);
  }

  /* Campus Street Lamps with Emissive Bulbs */
  generateCampusStreetLamps() {
    const lampGroup = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.9
    });

    const lampPositions = [
      { x: -6, z: 25 }, { x: 6, z: 25 },
      { x: -6, z: 45 }, { x: 6, z: 45 },
      { x: -6, z: 65 }, { x: 6, z: 65 },
      { x: -16, z: 0 }, { x: 16, z: 0 },
      { x: -35, z: -16 }, { x: 35, z: -16 },
      { x: 0, z: -28 }
    ];

    lampPositions.forEach((pos) => {
      const lamp = new THREE.Group();
      lamp.position.set(pos.x, 0, pos.z);

      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 4.2, 6);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 2.1;
      pole.castShadow = true;
      lamp.add(pole);

      // Arm & Lamp Head
      const headGeo = new THREE.SphereGeometry(0.4, 8, 8);
      const head = new THREE.Mesh(headGeo, bulbMat);
      head.position.set(0, 4.3, 0);
      lamp.add(head);

      lampGroup.add(lamp);
    });

    this.proceduralCampusGroup.add(lampGroup);
  }

  /* ========================================================================
     Custom Blender .GLB / .GLTF Campus Model Hook
     ======================================================================== */
  loadCustomCampusModel(modelUrl, onProgress = null, onError = null) {
    const loader = new GLTFLoader();
    console.log(`[Campus-Nexus] Initiating custom GLTF model load: ${modelUrl}`);

    loader.load(
      modelUrl,
      (gltf) => {
        console.log('[Campus-Nexus] Custom campus model loaded successfully.');

        // Hide procedural fallback geometry
        this.proceduralCampusGroup.visible = false;

        // Clean up previous custom model if exists
        if (this.customModelGroup) {
          this.scene.remove(this.customModelGroup);
        }

        this.customModelGroup = gltf.scene;
        this.customModelGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Match mesh name or userData.buildingId to campus data
            const matchedData = campusBuildings.find(
              (b) => b.id === child.name.toLowerCase() || b.id === child.userData.buildingId
            );

            if (matchedData) {
              child.userData = {
                buildingData: matchedData,
                isInteractive: true,
                originalEmissive: child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000),
                originalColor: child.material.color.clone()
              };
              this.interactiveMeshes.push(child);
              this.buildingMeshMap.set(matchedData.id, child);
            }
          }
        });

        this.scene.add(this.customModelGroup);
      },
      (xhr) => {
        if (onProgress) onProgress(xhr);
      },
      (error) => {
        console.warn('[Campus-Nexus] Failed to load custom GLTF model. Retaining procedural digital twin.', error);
        if (onError) onError(error);
      }
    );
  }

  /* ========================================================================
     Raycasting & Spatial Interaction System
     ======================================================================== */
  setupRaycasting() {
    window.addEventListener('pointermove', (event) => {
      // Calculate normalized device coordinates
      this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Building Click Handler
    window.addEventListener('click', (event) => {
      // Ignore click if user clicked on interactive HTML HUD elements
      if (
        event.target.closest('#hud-overlay') &&
        !event.target.closest('#webgl-container')
      ) {
        return;
      }

      if (this.hoveredMesh) {
        const bData = this.hoveredMesh.userData.buildingData;
        if (bData) {
          this.selectBuilding(bData);
        }
      }
    });
  }

  updateRaycasting() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;

      if (this.hoveredMesh !== hitMesh) {
        // Reset previous mesh
        this.resetHoverState();

        // Highlight new mesh
        this.hoveredMesh = hitMesh;
        if (hitMesh.material && hitMesh.material.emissive) {
          hitMesh.material.emissive.setHex(0x38bdf8);
          hitMesh.material.emissiveIntensity = 0.55;
        }

        document.body.style.cursor = 'pointer';
      }

      // Update Screen-Projected Tooltip Position
      const bData = hitMesh.userData.buildingData;
      if (bData) {
        this.updateScreenTooltip(hitMesh, bData);
      }
    } else {
      if (this.hoveredMesh) {
        this.resetHoverState();
      }
    }
  }

  resetHoverState() {
    if (this.hoveredMesh) {
      if (this.hoveredMesh.material && this.hoveredMesh.userData.originalEmissive) {
        this.hoveredMesh.material.emissive.copy(this.hoveredMesh.userData.originalEmissive);
        this.hoveredMesh.material.emissiveIntensity = 0.15;
      }
      this.hoveredMesh = null;
    }
    document.body.style.cursor = 'default';
    this.tooltip.classList.add('hidden');
  }

  /* Projects 3D Building Coordinate to 2D Screen Space for Floating Tooltip */
  updateScreenTooltip(mesh, bData) {
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    worldPos.y += bData.dimensions.height + 3;

    // Project world coordinates to normalized screen coordinates
    worldPos.project(this.camera);

    // Only display if object is in front of the camera
    if (worldPos.z < 1) {
      const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(worldPos.y * 0.5) + 0.5) * window.innerHeight;

      this.tooltip.style.left = `${x}px`;
      this.tooltip.style.top = `${y}px`;
      this.tooltipBadge.textContent = bData.category;
      this.tooltipTitle.textContent = bData.name;
      this.tooltip.classList.remove('hidden');
    } else {
      this.tooltip.classList.add('hidden');
    }
  }

  /* ========================================================================
     Cinematic Camera Navigation (GSAP)
     ======================================================================== */
  transitionCamera(targetPos, targetLookAt, duration = 1.6, onComplete = null) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Smoothly tween camera position
    gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: duration,
      ease: 'power3.inOut'
    });

    // Smoothly tween OrbitControls look-at target
    gsap.to(this.controls.target, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration: duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.controls.update();
      },
      onComplete: () => {
        this.isTransitioning = false;
        if (onComplete) onComplete();
      }
    });
  }

  selectBuilding(bData) {
    this.selectedBuilding = bData;

    // Trigger smooth GSAP camera fly-to
    this.transitionCamera(
      bData.focalPoint.camera,
      bData.focalPoint.target,
      1.5
    );

    // Populate and open Slide-Over Drawer
    this.populateDrawer(bData);
    this.openDrawer();

    // Update active state on navigation dock if matching
    this.updateDockSelection(bData.id);
  }

  /* ========================================================================
     HUD & UI Management (Drawer, Search, Atmosphere)
     ======================================================================== */
  populateDrawer(bData) {
    document.getElementById('drawer-title').textContent = bData.name;
    document.getElementById('drawer-code').textContent = bData.code;
    document.getElementById('drawer-category').textContent = bData.category;
    document.getElementById('drawer-category').style.borderColor = bData.tagColor;
    document.getElementById('drawer-category').style.color = bData.tagColor;
    document.getElementById('drawer-style').textContent = bData.architecturalStyle;
    document.getElementById('drawer-status').textContent = bData.status;
    document.getElementById('drawer-floors').textContent = `${bData.floors} Levels`;
    document.getElementById('drawer-capacity').textContent = bData.capacity;
    document.getElementById('drawer-built').textContent = bData.builtYear;
    document.getElementById('drawer-hours').textContent = bData.hours;
    document.getElementById('drawer-overview').textContent = bData.overview;
    document.getElementById('drawer-contact').textContent = bData.contact;

    // Facilities Tag Cloud
    const facContainer = document.getElementById('drawer-facilities');
    facContainer.innerHTML = '';
    bData.facilities.forEach((fac) => {
      const tag = document.createElement('span');
      tag.className = 'facility-tag';
      tag.textContent = fac;
      facContainer.appendChild(tag);
    });

    // Associated Departments List
    const deptContainer = document.getElementById('drawer-departments');
    deptContainer.innerHTML = '';
    bData.departments.forEach((dept) => {
      const li = document.createElement('li');
      li.textContent = dept;
      deptContainer.appendChild(li);
    });
  }

  openDrawer() {
    this.drawer.classList.remove('closed');
  }

  closeDrawer() {
    this.drawer.classList.add('closed');
    this.selectedBuilding = null;
  }

  /* Search & Autocomplete Engine */
  setupUIEvents() {
    // Drawer Close Button
    document.getElementById('drawer-close-btn').addEventListener('click', () => {
      this.closeDrawer();
    });

    // Drawer "Focus Camera" Action Button
    document.getElementById('drawer-focus-btn').addEventListener('click', () => {
      if (this.selectedBuilding) {
        this.transitionCamera(
          this.selectedBuilding.focalPoint.camera,
          this.selectedBuilding.focalPoint.target,
          1.2
        );
      }
    });

    // Drawer "Wayfinding Guide" Button
    document.getElementById('drawer-direction-btn').addEventListener('click', () => {
      if (this.selectedBuilding) {
        alert(
          `Navigating to: ${this.selectedBuilding.name}\nLocation: Zone ${this.selectedBuilding.code}\nRecommended Route: Take the central avenue pedestrian walkway via Plaza North.`
        );
      }
    });

    // Reset Camera Overview Button
    this.resetBtn.addEventListener('click', () => {
      const preset = cameraPresets.overview;
      this.transitionCamera(preset.camera, preset.target, preset.duration);
      this.closeDrawer();
      this.updateDockSelection('overview');
    });

    // Quick Navigation Dock Buttons
    this.quickDock.querySelectorAll('.dock-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const navKey = pill.getAttribute('data-nav');
        this.handleQuickNav(navKey);
      });
    });

    // Search Input with Autocomplete Dropdown
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      this.handleSearch(query);
    });

    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput.value.trim().length > 0) {
        this.searchDropdown.classList.remove('hidden');
      }
    });

    this.searchClearBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.searchDropdown.classList.add('hidden');
      this.searchClearBtn.classList.add('hidden');
    });

    // Global Keyboard Shortcut: '/' to focus search bar, 'Escape' to dismiss
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== this.searchInput) {
        e.preventDefault();
        this.searchInput.focus();
      } else if (e.key === 'Escape') {
        this.closeDrawer();
        this.searchDropdown.classList.add('hidden');
        this.searchInput.blur();
      }
    });

    // Hide search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        this.searchDropdown.classList.add('hidden');
      }
    });

    // Atmosphere / Theme Switcher Buttons (Day / Sunset / Night)
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.setEnvironmentTheme(theme);
      });
    });
  }

  handleSearch(query) {
    if (!query) {
      this.searchDropdown.classList.add('hidden');
      this.searchClearBtn.classList.add('hidden');
      return;
    }

    this.searchClearBtn.classList.remove('hidden');

    // Filter buildings by title, code, category, departments or facilities
    const results = campusBuildings.filter((b) => {
      return (
        b.name.toLowerCase().includes(query) ||
        b.shortName.toLowerCase().includes(query) ||
        b.code.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        b.departments.some((d) => d.toLowerCase().includes(query)) ||
        b.facilities.some((f) => f.toLowerCase().includes(query))
      );
    });

    this.renderSearchResults(results);
  }

  renderSearchResults(results) {
    this.searchDropdown.innerHTML = '';

    if (results.length === 0) {
      this.searchDropdown.innerHTML = `<div class="search-no-results">No matching campus buildings or labs found.</div>`;
    } else {
      results.forEach((b) => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
          <div class="search-item-info">
            <div class="search-item-title">${b.name}</div>
            <div class="search-item-sub">${b.category} • ${b.code}</div>
          </div>
          <div class="search-item-tag" style="border-color:${b.tagColor}">${b.shortName}</div>
        `;

        item.addEventListener('click', () => {
          this.searchDropdown.classList.add('hidden');
          this.searchInput.value = b.name;
          this.selectBuilding(b);
        });

        this.searchDropdown.appendChild(item);
      });
    }

    this.searchDropdown.classList.remove('hidden');
  }

  handleQuickNav(navKey) {
    const preset = cameraPresets[navKey];
    if (preset) {
      this.transitionCamera(preset.camera, preset.target, preset.duration);
      this.updateDockSelection(navKey);

      // If preset corresponds directly to a building, open its drawer
      const matchedBuilding = campusBuildings.find((b) => b.id === navKey);
      if (matchedBuilding) {
        this.populateDrawer(matchedBuilding);
        this.openDrawer();
      } else {
        this.closeDrawer();
      }
    }
  }

  updateDockSelection(navKey) {
    this.quickDock.querySelectorAll('.dock-pill').forEach((pill) => {
      if (pill.getAttribute('data-nav') === navKey) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  /* Smooth Atmospheric Lighting & Sky Theme Transition */
  setEnvironmentTheme(themeKey) {
    const theme = environmentThemes[themeKey];
    if (!theme) return;
    this.currentTheme = themeKey;

    const dur = 1.2;

    // Transition Fog & Background Colors
    gsap.to(this.scene.fog.color, {
      r: new THREE.Color(theme.fogColor).r,
      g: new THREE.Color(theme.fogColor).g,
      b: new THREE.Color(theme.fogColor).b,
      duration: dur
    });

    gsap.to(this.scene.background, {
      r: new THREE.Color(theme.skyColor).r,
      g: new THREE.Color(theme.skyColor).g,
      b: new THREE.Color(theme.skyColor).b,
      duration: dur
    });

    // Transition Sun & Hemisphere Light
    gsap.to(this.sunLight.color, {
      r: new THREE.Color(theme.sunColor).r,
      g: new THREE.Color(theme.sunColor).g,
      b: new THREE.Color(theme.sunColor).b,
      duration: dur
    });
    gsap.to(this.sunLight, { intensity: theme.sunIntensity, duration: dur });
    gsap.to(this.sunLight.position, {
      x: theme.sunPosition.x,
      y: theme.sunPosition.y,
      z: theme.sunPosition.z,
      duration: dur
    });

    gsap.to(this.hemiLight.color, {
      r: new THREE.Color(theme.hemiSky).r,
      g: new THREE.Color(theme.hemiSky).g,
      b: new THREE.Color(theme.hemiSky).b,
      duration: dur
    });
    gsap.to(this.hemiLight.groundColor, {
      r: new THREE.Color(theme.hemiGround).r,
      g: new THREE.Color(theme.hemiGround).g,
      b: new THREE.Color(theme.hemiGround).b,
      duration: dur
    });
    gsap.to(this.hemiLight, { intensity: theme.hemiIntensity, duration: dur });
  }

  /* ========================================================================
     Window Resize & Loading Helpers
     ======================================================================== */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  updateLoading(percent, statusText) {
    if (this.loadingFill) this.loadingFill.style.width = `${percent}%`;
    if (this.loadingPct) this.loadingPct.textContent = `${percent}%`;
    const subtitle = document.querySelector('.loading-subtitle');
    if (subtitle && statusText) subtitle.textContent = statusText;
  }

  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('fade-out');
    }
  }

  /* ========================================================================
     Continuous Animation & Render Loop
     ======================================================================== */
  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update OrbitControls
    this.controls.update();

    // 2. Animate 3D Floating Beacon Pins (Gentle Bobbing & Rotation)
    this.beacons.forEach((b) => {
      b.rotation.y = elapsedTime * 1.5;
      b.position.y = b.userData.baseY + Math.sin(elapsedTime * 2.2 + b.userData.phase) * 0.45;
    });

    // 3. Animate Pulsing Ground Rings
    this.pulseRings.forEach((ring) => {
      ring.currentProgress += ring.speed;
      if (ring.currentProgress > 1) ring.currentProgress = 0;

      const scale = 1 + ring.currentProgress * (ring.maxScale - 1);
      ring.mesh.scale.set(scale, scale, scale);
      ring.mesh.material.opacity = (1 - ring.currentProgress) * 0.75;
    });

    // 4. Subtle Water Body Shimmer
    if (this.waterMesh) {
      this.waterMesh.rotation.y = elapsedTime * 0.04;
    }

    // 5. Update Raycaster & Tooltip Projections
    this.updateRaycasting();

    // 6. Render Frame
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate Campus-Nexus Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.campusApp = new CampusNexusApp();
});
