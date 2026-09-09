"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import {
  somaiyaBuildings,
  somaiyaCameraPresets,
  somaiyaEnvironmentThemes,
  SomaiyaBuilding
} from "@/lib/somaiyaCampusData";
import { api } from "@/lib/api-client";
import {
  Search,
  Compass,
  MapPin,
  X,
  Sun,
  Sunset,
  Moon,
  Activity,
  RotateCcw,
  Layers,
  Sparkles,
  Users,
  Clock,
  Building as BuildingIcon,
  Navigation,
  CloudSun,
  DoorOpen,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVacantRoomsStatus, type RoomVacancyInfo } from "@/lib/relationalCampusData";
import Link from "next/link";

interface CampusDigitalTwinProps {
  onBuildingSelect?: (building: SomaiyaBuilding) => void;
  selectedBuildingId?: string | null;
  className?: string;
}

export default function CampusDigitalTwin({
  onBuildingSelect,
  selectedBuildingId,
  className = ""
}: CampusDigitalTwinProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Component UI State
  const [selectedBuilding, setSelectedBuilding] = useState<SomaiyaBuilding | null>(null);
  const [activeTheme, setActiveTheme] = useState<"day" | "sunset" | "night">("day");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SomaiyaBuilding[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeNavPill, setActiveNavPill] = useState<string>("overview");
  const [hoveredBuilding, setHoveredBuilding] = useState<SomaiyaBuilding | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [telemetry, setTelemetry] = useState<any>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  const sunVisualRef = useRef<THREE.Group | null>(null);
  const coronaMeshRef = useRef<THREE.Mesh | null>(null);
  const auraMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsRef = useRef<THREE.Group | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);

  const terrainMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const plazaMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const roadMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const interactiveMeshesRef = useRef<THREE.Mesh[]>([]);
  const buildingMeshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const beaconsRef = useRef<THREE.Mesh[]>([]);
  const pulseRingsRef = useRef<any[]>([]);
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const animatedTreesRef = useRef<Array<{ canopy: THREE.Mesh; baseRotZ: number; baseRotX: number; phase: number }>>([]);
  const pollenParticlesRef = useRef<THREE.Points | null>(null);
  const pollenInitialPositions = useRef<Float32Array | null>(null);

  // Load real-time backend / Firestore telemetry
  useEffect(() => {
    async function loadTelemetry() {
      try {
        const state = await api.digitalTwin.getCampusState();
        if (state) setTelemetry(state);
      } catch (err) {
        // graceful fallback to static catalog
      }
    }
    loadTelemetry();
  }, []);

  // Handle external selection if requested via props
  useEffect(() => {
    if (selectedBuildingId) {
      const match = somaiyaBuildings.find((b) => b.id === selectedBuildingId);
      if (match) {
        focusOnBuilding(match);
      }
    }
  }, [selectedBuildingId]);

  // Main Three.js Scene Lifecycle
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 650;

    // 1. Scene & Environment
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const initialTheme = somaiyaEnvironmentThemes[activeTheme];

    scene.background = new THREE.Color(initialTheme.skyColor);
    scene.fog = new THREE.Fog(
      initialTheme.fogColor,
      initialTheme.fogNear,
      initialTheme.fogFar
    );

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    const initialPreset = somaiyaCameraPresets.overview;
    camera.position.set(
      initialPreset.camera.x,
      initialPreset.camera.y,
      initialPreset.camera.z
    );
    cameraRef.current = camera;

    // 3. Renderer with ACES Tone Mapping, Soft Shadows & Logarithmic Depth Buffer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      logarithmicDepthBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = initialTheme.exposure || 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls with Damping & Floor Clamping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.08; // Cannot clip below ground plane
    controls.minPolarAngle = Math.PI / 8;
    controls.minDistance = 14;
    controls.maxDistance = 220;
    controls.target.set(initialPreset.target.x, initialPreset.target.y, initialPreset.target.z);
    controls.update();
    controlsRef.current = controls;

    // 5. Lighting Architecture (Bright, Sunny, Vibrant)
    const hemiLight = new THREE.HemisphereLight(
      initialTheme.hemiSky,
      initialTheme.hemiGround,
      initialTheme.hemiIntensity
    );
    hemiLight.position.set(0, 120, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(initialTheme.sunColor, initialTheme.sunIntensity);
    sunLight.position.set(initialTheme.sunPosition.x, initialTheme.sunPosition.y, initialTheme.sunPosition.z);
    sunLight.castShadow = true;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 320;
    const d = 120;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Warm Sun Fill Light
    const fillLight = new THREE.DirectionalLight(initialTheme.fillColor, initialTheme.fillIntensity);
    fillLight.position.set(-70, 50, -60);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    // 6. Radiant Sun Disc & Corona Halo in Sky
    const sunVisualGroup = new THREE.Group();
    const sunCoreGeo = new THREE.SphereGeometry(7.5, 32, 32);
    const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
    sunVisualGroup.add(sunCore);

    // Inner bright corona
    const coronaGeo = new THREE.RingGeometry(8, 26, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffeedd,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunVisualGroup.add(coronaMesh);
    coronaMeshRef.current = coronaMesh;

    // Outer warm atmospheric glow aura
    const auraGeo = new THREE.RingGeometry(25, 48, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffe2b8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    sunVisualGroup.add(auraMesh);
    auraMeshRef.current = auraMesh;

    sunVisualGroup.position.set(
      initialTheme.sunPosition.x,
      initialTheme.sunPosition.y,
      initialTheme.sunPosition.z
    );
    scene.add(sunVisualGroup);
    sunVisualRef.current = sunVisualGroup;

    // 7. Fluffy Procedural Daytime Clouds
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < 9; i++) {
      const cloudCluster = new THREE.Group();
      const puffCount = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < puffCount; p++) {
        const puff = new THREE.Mesh(
          new THREE.DodecahedronGeometry(7 + Math.random() * 6, 1),
          cloudMat
        );
        puff.position.set(
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 18
        );
        cloudCluster.add(puff);
      }
      cloudCluster.position.set(
        (Math.random() - 0.5) * 280,
        115 + Math.random() * 30,
        (Math.random() - 0.5) * 280
      );
      cloudGroup.add(cloudCluster);
    }
    scene.add(cloudGroup);
    cloudsRef.current = cloudGroup;

    // 8. Build Somaiya Campus Grounds & Roads (Lush, Clean, Vibrant)
    const campusGroup = new THREE.Group();
    scene.add(campusGroup);

    // Lush Campus Green Lawn Terrain (Base Ground Plane at y = 0.00 with polygon offset)
    const terrainGeo = new THREE.PlaneGeometry(420, 420, 32, 32);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: initialTheme.groundColor, // Vibrant lawn green
      roughness: 0.85,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = 0.0;
    terrain.receiveShadow = true;
    campusGroup.add(terrain);
    terrainMatRef.current = terrainMat;

    // Pathways Network: South Boulevard (Connecting main gate to central quad)
    const roadMat = new THREE.MeshStandardMaterial({
      color: initialTheme.roadColor,
      roughness: 0.78,
      metalness: 0.1
    });
    roadMatRef.current = roadMat;

    const southBlvdGeo = new THREE.PlaneGeometry(16, 90);
    southBlvdGeo.rotateX(-Math.PI / 2);
    const southBlvd = new THREE.Mesh(southBlvdGeo, roadMat);
    southBlvd.position.set(0, 0.06, 50);
    southBlvd.receiveShadow = true;
    campusGroup.add(southBlvd);

    // Boulevard center dividing line (Crisp road stripe)
    const roadStripeGeo = new THREE.PlaneGeometry(0.5, 85);
    roadStripeGeo.rotateX(-Math.PI / 2);
    const roadStripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const roadStripe = new THREE.Mesh(roadStripeGeo, roadStripeMat);
    roadStripe.position.set(0, 0.07, 50);
    campusGroup.add(roadStripe);

    // Central Quadrangle Plaza (Warm architectural sandstone pavers at y = 0.11, top at y = 0.21)
    const plazaGeo = new THREE.CylinderGeometry(85, 88, 0.20, 64);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: initialTheme.plazaColor,
      roughness: 0.72,
      metalness: 0.1
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = 0.11;
    plaza.receiveShadow = true;
    campusGroup.add(plaza);
    plazaMatRef.current = plazaMat;

    // Plaza Perimeter Marble Border Kerb (Elevated ring at y = 0.22)
    const kerbGeo = new THREE.RingGeometry(84.5, 88, 64);
    kerbGeo.rotateX(-Math.PI / 2);
    const kerbMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4
    });
    const kerb = new THREE.Mesh(kerbGeo, kerbMat);
    kerb.position.y = 0.22;
    kerb.receiveShadow = true;
    campusGroup.add(kerb);

    // Pedestrian East-West Cross Promenade
    const walkMat = new THREE.MeshStandardMaterial({
      color: 0xede8df, // Warm sandstone pedestrian pathway
      roughness: 0.7
    });
    const ewRoadGeo = new THREE.PlaneGeometry(160, 9);
    ewRoadGeo.rotateX(-Math.PI / 2);
    const ewRoad = new THREE.Mesh(ewRoadGeo, walkMat);
    ewRoad.position.set(0, 0.225, -16);
    ewRoad.receiveShadow = true;
    campusGroup.add(ewRoad);

    // Central Water Reflecting Pool (Sparkling azure water at y = 0.25, top surface y = 0.425)
    const waterGeo = new THREE.CylinderGeometry(15, 15, 0.35, 48);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // Azure water
      roughness: 0.06,
      metalness: 0.88,
      transparent: true,
      opacity: 0.88
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, 0.25, -5);
    waterMesh.receiveShadow = true;
    campusGroup.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // Water Fountain Core Jet Feature
    const fountainPlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.4, 0.9, 24),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    fountainPlinth.position.set(0, 0.6, -5);
    campusGroup.add(fountainPlinth);

    // Somaiya Sports Academy Running Track & Turf Pitch
    const trackGroup = new THREE.Group();
    trackGroup.position.set(-52, 0.05, -45);

    // Red clay oval track
    const trackClayGeo = new THREE.RingGeometry(20, 30, 48);
    trackClayGeo.rotateX(-Math.PI / 2);
    const trackClayMat = new THREE.MeshStandardMaterial({
      color: 0xc25e3b, // Terracotta running track
      roughness: 0.85
    });
    const trackClay = new THREE.Mesh(trackClayGeo, trackClayMat);
    trackClay.position.y = 0.01;
    trackClay.receiveShadow = true;
    trackGroup.add(trackClay);

    // White track lane divider rings
    for (let r = 22.5; r <= 28; r += 2.5) {
      const laneLineGeo = new THREE.RingGeometry(r - 0.08, r + 0.08, 48);
      laneLineGeo.rotateX(-Math.PI / 2);
      const laneLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const laneLine = new THREE.Mesh(laneLineGeo, laneLineMat);
      laneLine.position.y = 0.02;
      trackGroup.add(laneLine);
    }

    // Inner green sports lawn
    const trackTurfGeo = new THREE.CircleGeometry(20, 48);
    trackTurfGeo.rotateX(-Math.PI / 2);
    const trackTurfMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Fresh athletic grass
      roughness: 0.8
    });
    const trackTurf = new THREE.Mesh(trackTurfGeo, trackTurfMat);
    trackTurf.position.y = 0.015;
    trackTurf.receiveShadow = true;
    trackGroup.add(trackTurf);

    campusGroup.add(trackGroup);

    // -------------------------------------------------------------
    // Somaiya Campus Green Spaces & Botanical Garden Zones
    // Raised Architectural Planters (Strictly elevated: top surface at y = 0.51, zero z-fighting)
    // -------------------------------------------------------------
    const gardenGroup = new THREE.Group();

    // 1. Somaiya Central Quadrangle Lawns (Between SSBAS, Library & Gargi Plaza)
    // Retaining planter curb in warm sandstone
    const quadKerbGeo = new THREE.BoxGeometry(37.2, 0.28, 29.2);
    const planterKerbMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.6 });
    const quadKerb = new THREE.Mesh(quadKerbGeo, planterKerbMat);
    quadKerb.position.set(6, 0.35, -2);
    quadKerb.receiveShadow = true;
    gardenGroup.add(quadKerb);

    // Lush elevated turf bed (y = 0.36, height = 0.30 -> top is at y = 0.51, 0.30m above plaza!)
    const quadLawnGeo = new THREE.BoxGeometry(36, 0.30, 28);
    const quadLawnMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32, // Deep lush lawn grass
      roughness: 0.8,
    });
    const quadLawn = new THREE.Mesh(quadLawnGeo, quadLawnMat);
    quadLawn.position.set(6, 0.36, -2);
    quadLawn.receiveShadow = true;
    gardenGroup.add(quadLawn);

    // Stone pathway slicing across quad lawn
    const quadPathGeo = new THREE.PlaneGeometry(3, 28);
    quadPathGeo.rotateX(-Math.PI / 2);
    const quadPath = new THREE.Mesh(quadPathGeo, walkMat);
    quadPath.position.set(6, 0.52, -2);
    quadPath.receiveShadow = true;
    gardenGroup.add(quadPath);

    // Flowering hedges along quad perimeter
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.7 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xe91e63, roughness: 0.5 }); // Bougainvillea pink

    for (let x = -10; x <= 22; x += 8) {
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 1.2), hedgeMat);
      hedge.position.set(x, 0.8, 12);
      hedge.castShadow = true;
      gardenGroup.add(hedge);

      // Flower dots
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), flowerMat);
      flower.position.set(x, 1.5, 12);
      gardenGroup.add(flower);
    }

    // 2. Granthagar Reading Grove (Adjacent to Central Library)
    const groveKerbGeo = new THREE.CylinderGeometry(14.8, 15.6, 0.28, 36);
    const groveKerb = new THREE.Mesh(groveKerbGeo, planterKerbMat);
    groveKerb.position.set(-18, 0.35, 24);
    groveKerb.receiveShadow = true;
    gardenGroup.add(groveKerb);

    const groveLawnGeo = new THREE.CylinderGeometry(14, 14.8, 0.30, 36);
    const groveLawnMat = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.85 });
    const groveLawn = new THREE.Mesh(groveLawnGeo, groveLawnMat);
    groveLawn.position.set(-18, 0.36, 24);
    groveLawn.receiveShadow = true;
    gardenGroup.add(groveLawn);

    // 3. Aurobindo Botanical Parterre & Shaded Benches
    const auroKerbGeo = new THREE.BoxGeometry(23.2, 0.28, 33.2);
    const auroKerb = new THREE.Mesh(auroKerbGeo, planterKerbMat);
    auroKerb.position.set(-46, 0.35, -2);
    auroKerb.receiveShadow = true;
    gardenGroup.add(auroKerb);

    const auroLawnGeo = new THREE.BoxGeometry(22, 0.30, 32);
    const auroLawn = new THREE.Mesh(auroLawnGeo, quadLawnMat);
    auroLawn.position.set(-46, 0.36, -2);
    auroLawn.receiveShadow = true;
    gardenGroup.add(auroLawn);

    // -------------------------------------------------------------
    // Procedural 3D Botanical Trees with Animated Canopies
    // -------------------------------------------------------------
    animatedTreesRef.current = [];
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 3.8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x543d2b, // Natural tree bark brown
      roughness: 0.9,
    });

    const canopyColors = [0x15803d, 0x16a34a, 0x10b981, 0x059669, 0x22c55e];

    const treeLocations: [number, number, number, number][] = [
      // Quadrangle Lawns (x, z, scale, phase)
      [-6, -4, 1.1, 0.2],
      [18, -4, 1.25, 0.8],
      [-6, 6, 1.0, 1.4],
      [18, 6, 1.15, 2.1],
      [6, -10, 1.3, 0.5],
      [6, 8, 1.05, 1.8],
      // Granthagar Reading Grove
      [-24, 26, 1.3, 0.3],
      [-12, 26, 1.1, 1.1],
      [-20, 16, 1.2, 2.4],
      [-26, 18, 0.95, 0.7],
      [-14, 32, 1.15, 1.9],
      // Aurobindo Parterre & Botanical Borders
      [-38, -12, 1.2, 0.4],
      [-54, -12, 1.0, 1.6],
      [-38, 8, 1.3, 2.2],
      [-54, 8, 1.15, 0.9],
      [-46, 12, 1.25, 1.3],
      // South Boulevard Tree Avenue
      [-12, 15, 1.2, 0.6],
      [12, 15, 1.2, 1.7],
      [-12, 35, 1.25, 2.3],
      [12, 35, 1.25, 0.4],
      [-12, 55, 1.15, 1.5],
      [12, 55, 1.15, 2.8],
    ];

    treeLocations.forEach(([tx, tz, scale, phase], idx) => {
      const tree = new THREE.Group();
      tree.position.set(tx, 0.3, tz);
      tree.scale.set(scale, scale, scale);

      // Wooden trunk
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.9;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      // Layered organic foliage canopy
      const canopyColor = canopyColors[idx % canopyColors.length];
      const canopyMat = new THREE.MeshStandardMaterial({
        color: canopyColor,
        roughness: 0.75,
        metalness: 0.05,
      });

      const canopyGroup = new THREE.Group();
      canopyGroup.position.y = 3.6;

      const mainCanopy = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.2, 1),
        canopyMat
      );
      mainCanopy.castShadow = true;
      canopyGroup.add(mainCanopy);

      // Secondary top puff
      const topPuff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.5, 1),
        canopyMat
      );
      topPuff.position.set(0.3, 1.4, -0.2);
      topPuff.castShadow = true;
      canopyGroup.add(topPuff);

      tree.add(canopyGroup);
      gardenGroup.add(tree);

      animatedTreesRef.current.push({
        canopy: canopyGroup as unknown as THREE.Mesh,
        baseRotZ: 0,
        baseRotX: 0,
        phase: phase,
      });
    });

    // -------------------------------------------------------------
    // Ambient Drifting Pollen / Petal Particles
    // -------------------------------------------------------------
    const pollenCount = 120;
    const pollenPositions = new Float32Array(pollenCount * 3);
    for (let i = 0; i < pollenCount; i++) {
      pollenPositions[i * 3] = (Math.random() - 0.5) * 160;
      pollenPositions[i * 3 + 1] = 1.5 + Math.random() * 12;
      pollenPositions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    const pollenGeo = new THREE.BufferGeometry();
    pollenGeo.setAttribute("position", new THREE.BufferAttribute(pollenPositions, 3));
    pollenInitialPositions.current = new Float32Array(pollenPositions);

    const pollenMat = new THREE.PointsMaterial({
      color: 0xfef08a, // Soft golden dandelion/pollen
      size: 0.65,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const pollenPoints = new THREE.Points(pollenGeo, pollenMat);
    gardenGroup.add(pollenPoints);
    pollenParticlesRef.current = pollenPoints;

    campusGroup.add(gardenGroup);
    interactiveMeshesRef.current = [];
    buildingMeshMapRef.current.clear();
    beaconsRef.current = [];
    pulseRingsRef.current = [];

    somaiyaBuildings.forEach((bData) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bData.coordinates.x, 0, bData.coordinates.z);

      const { width, height, depth } = bData.dimensions;

      // 1. Multi-tier Architectural Podium & Entrance Steps
      const baseGeo = new THREE.BoxGeometry(width + 3.2, 0.6, depth + 3.2);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xd6d3d1, // Clean architectural limestone
        roughness: 0.65,
        metalness: 0.08
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.3;
      baseMesh.receiveShadow = true;
      bGroup.add(baseMesh);

      // Dark slate foundation plinth rim
      const rimGeo = new THREE.BoxGeometry(width + 3.5, 0.16, depth + 3.5);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.position.y = 0.68;
      bGroup.add(rimMesh);

      // Tiered entrance stairs at front of building
      const stepWidth = Math.min(width * 0.5, 12);
      for (let s = 0; s < 3; s++) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(stepWidth + (2 - s) * 0.6, 0.16, 1.2),
          baseMat
        );
        step.position.set(0, 0.08 + s * 0.16, depth / 2 + 1.8 - s * 0.4);
        step.receiveShadow = true;
        bGroup.add(step);
      }

      // 2. Primary Structural Core
      const wallBaseColor = new THREE.Color(0xf1f5f9);
      const accentColor = new THREE.Color(bData.tagColor);
      const finalWallColor = wallBaseColor.clone().lerp(accentColor, 0.22);

      const coreGeo = new THREE.BoxGeometry(width, height, depth);
      const coreMat = new THREE.MeshStandardMaterial({
        color: finalWallColor,
        roughness: 0.38,
        metalness: 0.15
      });
      const primaryMesh = new THREE.Mesh(coreGeo, coreMat);
      primaryMesh.position.y = height / 2 + 0.6;
      primaryMesh.castShadow = true;
      primaryMesh.receiveShadow = true;
      bGroup.add(primaryMesh);

      // 3. Somaiya Architectural Pylon / Brand Identity Pillar
      const pylonGeo = new THREE.BoxGeometry(1.2, height + 1.4, 1.2);
      const pylonMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(bData.tagColor),
        roughness: 0.3,
        metalness: 0.4
      });
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.set(-width / 2 + 0.6, (height + 1.4) / 2 + 0.6, depth / 2 + 0.2);
      pylon.castShadow = true;
      bGroup.add(pylon);

      // 4. Grand Entrance Portico & Modern Floating Canopy
      const canopyWidth = Math.min(width * 0.6, 14);
      const canopyGeo = new THREE.BoxGeometry(canopyWidth, 0.35, 4.2);
      const canopyMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b, // Architectural dark charcoal
        roughness: 0.3,
        metalness: 0.5
      });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(0, 3.8, depth / 2 + 2.1);
      canopy.castShadow = true;
      bGroup.add(canopy);

      // Colonnade Pillars supporting the entrance canopy
      const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 3.2, 16);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.3,
        metalness: 0.2
      });
      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
      leftPillar.position.set(-canopyWidth / 2 + 0.8, 2.2, depth / 2 + 3.6);
      leftPillar.castShadow = true;
      bGroup.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
      rightPillar.position.set(canopyWidth / 2 - 0.8, 2.2, depth / 2 + 3.6);
      rightPillar.castShadow = true;
      bGroup.add(rightPillar);

      // Illuminated Glass Entrance Lobby Portal
      const entrancePortalGeo = new THREE.BoxGeometry(canopyWidth * 0.65, 2.6, 0.4);
      const entrancePortalMat = new THREE.MeshStandardMaterial({
        color: 0xffedd5,
        emissive: 0xfbbf24,
        emissiveIntensity: activeTheme === "night" ? 1.8 : 0.6,
        roughness: 0.1,
        metalness: 0.3
      });
      const entrancePortal = new THREE.Mesh(entrancePortalGeo, entrancePortalMat);
      entrancePortal.position.set(0, 1.9, depth / 2 + 0.2);
      bGroup.add(entrancePortal);

      // 5. High-Detail Facade Glazing, Spandrels & Vertical Sun-Shade Fins
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8, // Reflective sky azure
        emissive: new THREE.Color(bData.tagColor),
        emissiveIntensity: activeTheme === "night" ? 1.5 : 0.35,
        roughness: 0.08,
        metalness: 0.85
      });

      const spandrelMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4,
        metalness: 0.4
      });

      // Window Bays & Floor Spandrels across floors
      const floorH = height / bData.floors;
      for (let f = 1; f <= bData.floors; f++) {
        const floorCenterY = (f - 0.5) * floorH + 0.6;

        // Front window bay
        const winFrontGeo = new THREE.BoxGeometry(width - 3, floorH * 0.55, 0.3);
        const winFront = new THREE.Mesh(winFrontGeo, glassMat);
        winFront.position.set(0, floorCenterY, depth / 2 + 0.1);
        bGroup.add(winFront);

        // Rear window bay
        const winBackGeo = new THREE.BoxGeometry(width - 3, floorH * 0.55, 0.3);
        const winBack = new THREE.Mesh(winBackGeo, glassMat);
        winBack.position.set(0, floorCenterY, -depth / 2 - 0.1);
        bGroup.add(winBack);

        // Floor Spandrel Band separating floors
        if (f < bData.floors) {
          const spandrelGeo = new THREE.BoxGeometry(width + 0.3, floorH * 0.25, depth + 0.3);
          const spandrel = new THREE.Mesh(spandrelGeo, spandrelMat);
          spandrel.position.y = f * floorH + 0.6;
          spandrel.castShadow = true;
          bGroup.add(spandrel);
        }
      }

      // Vertical architectural sun-shade fins across front facade
      const numFins = Math.max(3, Math.floor(width / 3.5));
      const finGeo = new THREE.BoxGeometry(0.25, height * 0.88, 0.7);
      const finMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.1
      });
      for (let i = 0; i < numFins; i++) {
        const finX = -((numFins - 1) * 3.2) / 2 + i * 3.2;
        if (Math.abs(finX) < width / 2 - 1.2) {
          const fin = new THREE.Mesh(finGeo, finMat);
          fin.position.set(finX, height / 2 + 0.9, depth / 2 + 0.35);
          fin.castShadow = true;
          bGroup.add(fin);
        }
      }

      // 6. Modern Architectural Rooftop Complex
      // Rooftop Parapet Enclosure Wall
      const parapetGeo = new THREE.BoxGeometry(width + 0.25, 0.8, depth + 0.25);
      const parapetMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.5
      });
      const parapet = new THREE.Mesh(parapetGeo, parapetMat);
      parapet.position.y = height + 1.0;
      parapet.castShadow = true;
      bGroup.add(parapet);

      // Elevator Penthouse & Stairwell Tower
      const penthouseGeo = new THREE.BoxGeometry(width * 0.35, 2.4, depth * 0.35);
      const penthouseMat = new THREE.MeshStandardMaterial({
        color: 0x475569, // Modern slate tower
        roughness: 0.4,
        metalness: 0.3
      });
      const penthouse = new THREE.Mesh(penthouseGeo, penthouseMat);
      penthouse.position.set(-width * 0.2, height + 1.8, -depth * 0.15);
      penthouse.castShadow = true;
      bGroup.add(penthouse);

      // HVAC Mechanical Plant & Ventilation Units
      const hvacGeo = new THREE.BoxGeometry(Math.min(width * 0.3, 4), 1.3, Math.min(depth * 0.25, 3));
      const hvacMat = new THREE.MeshStandardMaterial({
        color: 0x64748b, // Galvanized metal plant
        roughness: 0.3,
        metalness: 0.7
      });
      const hvac = new THREE.Mesh(hvacGeo, hvacMat);
      hvac.position.set(width * 0.22, height + 1.25, depth * 0.15);
      hvac.castShadow = true;
      bGroup.add(hvac);

      // Photovoltaic Solar Panel Array
      const solarPanelGeo = new THREE.BoxGeometry(Math.min(width * 0.4, 5.5), 0.15, Math.min(depth * 0.3, 3.8));
      const solarMat = new THREE.MeshStandardMaterial({
        color: 0x1e1b4b, // Deep photovoltaic blue
        roughness: 0.1,
        metalness: 0.9
      });
      const solarPanel = new THREE.Mesh(solarPanelGeo, solarMat);
      solarPanel.rotation.x = -0.22; // 12-degree solar tilt
      solarPanel.position.set(width * 0.15, height + 1.5, -depth * 0.2);
      solarPanel.castShadow = true;
      bGroup.add(solarPanel);

      // Metadata for Raycasting
      primaryMesh.userData = {
        buildingData: bData,
        originalEmissive: new THREE.Color(0x000000)
      };

      interactiveMeshesRef.current.push(primaryMesh);
      buildingMeshMapRef.current.set(bData.id, primaryMesh);

      // 3D Floating Beacon Gem & Pulsing Ground Ring
      const beaconGeo = new THREE.OctahedronGeometry(1.2, 0);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(bData.tagColor),
        emissive: new THREE.Color(bData.tagColor),
        emissiveIntensity: 0.95
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(0, height + 4.8, 0);
      beaconMesh.userData = { baseY: height + 4.8, phase: Math.random() * Math.PI };
      bGroup.add(beaconMesh);
      beaconsRef.current.push(beaconMesh);

      const ringGeo = new THREE.RingGeometry(2.5, 3.5, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(bData.tagColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, 0.26, 0);
      bGroup.add(ringMesh);
      pulseRingsRef.current.push({
        mesh: ringMesh,
        maxScale: 2.8,
        speed: 0.015 + Math.random() * 0.005,
        progress: Math.random()
      });

      campusGroup.add(bGroup);
    });

    // 10. Lush Campus Trees (Vibrant Greens, Layered Foliage)
    const treeGroup = new THREE.Group();
    const perimeterTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.85 });
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.75 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75 });
    const foliageMat3 = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.75 });

    const treePositions = [
      { x: -14, z: 22 }, { x: 14, z: 22 },
      { x: -14, z: 40 }, { x: 14, z: 40 },
      { x: -14, z: 58 }, { x: 14, z: 58 },
      { x: -18, z: -4 }, { x: 18, z: -4 },
      { x: -16, z: 12 }, { x: 16, z: 12 },
      { x: -45, z: -10 }, { x: 45, z: -10 },
      { x: -35, z: 10 }, { x: 35, z: 10 },
      { x: -60, z: 25 }, { x: 60, z: 25 },
      { x: -25, z: -35 }, { x: 25, z: -35 },
      { x: 0, z: -30 }, { x: -8, z: -25 }, { x: 8, z: -25 },
      { x: -48, z: 45 }, { x: 48, z: 45 },
      { x: -30, z: 55 }, { x: 30, z: 55 }
    ];

    treePositions.forEach((pos, idx) => {
      const tree = new THREE.Group();
      tree.position.set(pos.x, 0, pos.z);

      const perimeterTrunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.8, 8);
      const trunk = new THREE.Mesh(perimeterTrunkGeo, perimeterTrunkMat);
      trunk.position.y = 1.4;
      trunk.castShadow = true;
      tree.add(trunk);

      const folMat = idx % 3 === 0 ? foliageMat1 : idx % 3 === 1 ? foliageMat2 : foliageMat3;

      for (let i = 0; i < 3; i++) {
        const coneGeo = new THREE.ConeGeometry(2.4 - i * 0.55, 2.5, 8);
        const cone = new THREE.Mesh(coneGeo, folMat);
        cone.position.y = 3.0 + i * 1.5;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      }
      treeGroup.add(tree);
    });
    campusGroup.add(treeGroup);

    // 11. Raycasting Pointer Handler
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveMeshesRef.current, false);

      if (hits.length > 0) {
        const mesh = hits[0].object as THREE.Mesh;
        if (hoveredMeshRef.current !== mesh) {
          if (hoveredMeshRef.current && (hoveredMeshRef.current.material as any).emissive) {
            (hoveredMeshRef.current.material as any).emissive.setHex(0x000000);
          }
          hoveredMeshRef.current = mesh;
          if ((mesh.material as any).emissive) {
            (mesh.material as any).emissive.setHex(0x38bdf8);
            (mesh.material as any).emissiveIntensity = 0.55;
          }
          container.style.cursor = "pointer";
        }

        const bData: SomaiyaBuilding = mesh.userData.buildingData;
        setHoveredBuilding(bData);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        if (hoveredMeshRef.current && (hoveredMeshRef.current.material as any).emissive) {
          (hoveredMeshRef.current.material as any).emissive.setHex(0x000000);
          hoveredMeshRef.current = null;
        }
        container.style.cursor = "grab";
        setHoveredBuilding(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".hud-interactive")) return;
      if (hoveredMeshRef.current) {
        const bData: SomaiyaBuilding = hoveredMeshRef.current.userData.buildingData;
        if (bData) {
          focusOnBuilding(bData);
        }
      }
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("click", handleClick);

    // 12. Window Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 650;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 13. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clockRef.current.getElapsedTime();

      controls.update();

      // Look corona & aura at camera for natural sun lens flare effect
      if (coronaMeshRef.current && camera) {
        coronaMeshRef.current.lookAt(camera.position);
      }
      if (auraMeshRef.current && camera) {
        auraMeshRef.current.lookAt(camera.position);
      }

      // Gentle drifting clouds
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += 0.0003;
      }

      // Water gentle shimmering surface
      if (waterMeshRef.current) {
        waterMeshRef.current.position.y = 0.35 + Math.sin(elapsed * 2.0) * 0.02;
      }

      // Animate Beacons
      beaconsRef.current.forEach((b) => {
        b.rotation.y = elapsed * 1.5;
        b.position.y = b.userData.baseY + Math.sin(elapsed * 2.2 + b.userData.phase) * 0.4;
      });

      // Animate Pulsing Ground Rings
      pulseRingsRef.current.forEach((ring) => {
        ring.progress += ring.speed;
        if (ring.progress > 1) ring.progress = 0;
        const scale = 1 + ring.progress * (ring.maxScale - 1);
        ring.mesh.scale.set(scale, scale, scale);
        ring.mesh.material.opacity = (1 - ring.progress) * 0.8;
      });

      // Animate 3D Garden: Botanical Tree Canopies Swaying in Subtle Breeze
      animatedTreesRef.current.forEach((t) => {
        t.canopy.rotation.z = Math.sin(elapsed * 1.5 + t.phase) * 0.045;
        t.canopy.rotation.x = Math.cos(elapsed * 1.2 + t.phase) * 0.035;
      });

      // Animate 3D Garden: Drifting Pollen / Petal Particles
      if (pollenParticlesRef.current) {
        const posAttr = pollenParticlesRef.current.geometry.attributes.position;
        const array = posAttr.array as Float32Array;
        for (let i = 0; i < array.length / 3; i++) {
          array[i * 3 + 1] += Math.sin(elapsed * 1.2 + i) * 0.02 - 0.005;
          array[i * 3] += Math.cos(elapsed * 0.6 + i) * 0.015;
          if (array[i * 3 + 1] < 1.0) {
            array[i * 3 + 1] = 12.0;
          }
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("click", handleClick);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Smooth Camera Transition via GSAP
  const transitionCamera = (targetCam: any, targetLookAt: any, duration = 1.6) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    gsap.to(camera.position, {
      x: targetCam.x,
      y: targetCam.y,
      z: targetCam.z,
      duration,
      ease: "power3.inOut"
    });

    gsap.to(controls.target, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration,
      ease: "power3.inOut",
      onUpdate: () => controls.update()
    });
  };

  const focusOnBuilding = (building: SomaiyaBuilding) => {
    setSelectedBuilding(building);
    setActiveNavPill(building.id);
    transitionCamera(building.focalPoint.camera, building.focalPoint.target, 1.5);
    if (onBuildingSelect) onBuildingSelect(building);
  };

  const handleNavPillClick = (presetKey: string) => {
    setActiveNavPill(presetKey);
    const preset = somaiyaCameraPresets[presetKey];
    if (preset) {
      transitionCamera(preset.camera, preset.target, preset.duration);
      const matched = somaiyaBuildings.find((b) => b.id === presetKey);
      if (matched) {
        setSelectedBuilding(matched);
      } else {
        setSelectedBuilding(null);
      }
    }
  };

  // Atmosphere Switching (Daylight / Sunset / Cyber Midnight)
  const setEnvironmentTheme = (themeKey: "day" | "sunset" | "night") => {
    setActiveTheme(themeKey);
    const theme = somaiyaEnvironmentThemes[themeKey];
    if (!sceneRef.current || !sunLightRef.current || !hemiLightRef.current) return;

    const scene = sceneRef.current;
    const sunLight = sunLightRef.current;
    const hemiLight = hemiLightRef.current;
    const fillLight = fillLightRef.current;
    const renderer = rendererRef.current;
    const terrainMat = terrainMatRef.current;
    const plazaMat = plazaMatRef.current;
    const roadMat = roadMatRef.current;
    const sunVisual = sunVisualRef.current;
    const clouds = cloudsRef.current;
    const dur = 1.2;

    if (scene.fog) {
      gsap.to(scene.fog.color, {
        r: new THREE.Color(theme.fogColor).r,
        g: new THREE.Color(theme.fogColor).g,
        b: new THREE.Color(theme.fogColor).b,
        duration: dur
      });
      gsap.to(scene.fog, { near: theme.fogNear, far: theme.fogFar, duration: dur });
    }

    gsap.to(scene.background as THREE.Color, {
      r: new THREE.Color(theme.skyColor).r,
      g: new THREE.Color(theme.skyColor).g,
      b: new THREE.Color(theme.skyColor).b,
      duration: dur
    });

    if (renderer) {
      gsap.to(renderer, { toneMappingExposure: theme.exposure || 1.35, duration: dur });
    }

    gsap.to(sunLight.color, {
      r: new THREE.Color(theme.sunColor).r,
      g: new THREE.Color(theme.sunColor).g,
      b: new THREE.Color(theme.sunColor).b,
      duration: dur
    });
    gsap.to(sunLight, { intensity: theme.sunIntensity, duration: dur });
    gsap.to(sunLight.position, {
      x: theme.sunPosition.x,
      y: theme.sunPosition.y,
      z: theme.sunPosition.z,
      duration: dur
    });

    if (sunVisual) {
      gsap.to(sunVisual.position, {
        x: theme.sunPosition.x,
        y: theme.sunPosition.y,
        z: theme.sunPosition.z,
        duration: dur
      });
      gsap.to(sunVisual.scale, {
        x: themeKey === "night" ? 0.35 : 1,
        y: themeKey === "night" ? 0.35 : 1,
        z: themeKey === "night" ? 0.35 : 1,
        duration: dur
      });
    }

    if (clouds) {
      gsap.to(clouds.position, {
        y: themeKey === "night" ? -120 : 0,
        duration: dur
      });
    }

    if (fillLight) {
      gsap.to(fillLight.color, {
        r: new THREE.Color(theme.fillColor).r,
        g: new THREE.Color(theme.fillColor).g,
        b: new THREE.Color(theme.fillColor).b,
        duration: dur
      });
      gsap.to(fillLight, { intensity: theme.fillIntensity, duration: dur });
    }

    gsap.to(hemiLight.color, {
      r: new THREE.Color(theme.hemiSky).r,
      g: new THREE.Color(theme.hemiSky).g,
      b: new THREE.Color(theme.hemiSky).b,
      duration: dur
    });
    gsap.to(hemiLight.groundColor, {
      r: new THREE.Color(theme.hemiGround).r,
      g: new THREE.Color(theme.hemiGround).g,
      b: new THREE.Color(theme.hemiGround).b,
      duration: dur
    });
    gsap.to(hemiLight, { intensity: theme.hemiIntensity, duration: dur });

    if (terrainMat) {
      gsap.to(terrainMat.color, {
        r: new THREE.Color(theme.groundColor).r,
        g: new THREE.Color(theme.groundColor).g,
        b: new THREE.Color(theme.groundColor).b,
        duration: dur
      });
    }

    if (plazaMat) {
      gsap.to(plazaMat.color, {
        r: new THREE.Color(theme.plazaColor).r,
        g: new THREE.Color(theme.plazaColor).g,
        b: new THREE.Color(theme.plazaColor).b,
        duration: dur
      });
    }

    if (roadMat) {
      gsap.to(roadMat.color, {
        r: new THREE.Color(theme.roadColor).r,
        g: new THREE.Color(theme.roadColor).g,
        b: new THREE.Color(theme.roadColor).b,
        duration: dur
      });
    }
  };

  // Search filter
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const filtered = somaiyaBuildings.filter((b) =>
      b.name.toLowerCase().includes(q.toLowerCase()) ||
      b.shortName.toLowerCase().includes(q.toLowerCase()) ||
      b.code.toLowerCase().includes(q.toLowerCase()) ||
      b.departments.some((d) => d.toLowerCase().includes(q.toLowerCase())) ||
      b.facilities.some((f) => f.toLowerCase().includes(q.toLowerCase()))
    );
    setSearchResults(filtered);
    setShowDropdown(true);
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl ${className}`} style={{ height: "calc(100vh - 220px)", minHeight: "560px" }}>
      {/* 3D WebGL Canvas Mounting Point */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing outline-none" />

      {/* Screen Projected 3D Hover Tooltip */}
      {hoveredBuilding && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-[120%] bg-campus-card/95 border border-campus-primary/60 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md transition-all duration-150"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: hoveredBuilding.tagColor }}
            />
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
              {hoveredBuilding.code}
            </span>
          </div>
          <p className="text-xs font-bold text-white whitespace-nowrap">
            {hoveredBuilding.shortName}
          </p>
          <p className="text-[10px] text-gray-300 font-medium">
            {hoveredBuilding.floors} Floors • {hoveredBuilding.category}
          </p>
        </div>
      )}

      {/* HUD Header Bar: Search & Atmosphere Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80 hud-interactive pointer-events-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search KJSCE, Library, Labs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (searchQuery.trim()) setShowDropdown(true); }}
              className="w-full pl-9 pr-8 py-2 bg-campus-card/85 text-xs text-white placeholder-gray-400 rounded-full border border-white/10 focus:outline-none focus:border-campus-primary backdrop-blur-xl shadow-lg transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowDropdown(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-campus-card/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl z-40 max-h-60 overflow-y-auto p-1.5 space-y-1">
              {searchResults.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    focusOnBuilding(b);
                    setShowDropdown(false);
                    setSearchQuery(b.shortName);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 text-left transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{b.name}</div>
                    <div className="text-[10px] text-gray-400">{b.category}</div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono border-campus-primary/40 text-campus-primary">
                    {b.code}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Atmosphere Lighting Switcher & Reset Button */}
        <div className="hud-interactive flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center bg-campus-card/85 border border-white/10 rounded-full p-1 backdrop-blur-xl shadow-lg">
            <button
              onClick={() => setEnvironmentTheme("day")}
              title="Daylight — Bright Sun & Clear Sky"
              className={`p-1.5 rounded-full transition-all flex items-center gap-1 text-xs px-2.5 font-medium ${
                activeTheme === "day"
                  ? "bg-amber-400/20 text-amber-300 shadow-sm border border-amber-400/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Day</span>
            </button>
            <button
              onClick={() => setEnvironmentTheme("sunset")}
              title="Golden Hour — Warm Sunset"
              className={`p-1.5 rounded-full transition-all flex items-center gap-1 text-xs px-2.5 font-medium ${
                activeTheme === "sunset"
                  ? "bg-orange-500/20 text-orange-400 shadow-sm border border-orange-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Sunset</span>
            </button>
            <button
              onClick={() => setEnvironmentTheme("night")}
              title="Cyber Midnight — Nocturnal Glow"
              className={`p-1.5 rounded-full transition-all flex items-center gap-1 text-xs px-2.5 font-medium ${
                activeTheme === "night"
                  ? "bg-blue-500/20 text-blue-400 shadow-sm border border-blue-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Night</span>
            </button>
          </div>

          <button
            onClick={() => handleNavPillClick("overview")}
            title="Reset Campus Aerial View"
            className="p-2 bg-campus-card/85 border border-white/10 rounded-full text-gray-300 hover:text-white hover:border-campus-primary/50 backdrop-blur-xl shadow-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slide-Over Inspection Drawer */}
      <div
        className={`hud-interactive absolute top-0 right-0 bottom-0 w-full sm:w-[380px] bg-campus-card/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl z-40 transform transition-transform duration-300 ease-out flex flex-col ${
          selectedBuilding ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {selectedBuilding && (
          <div className="h-full flex flex-col p-5 overflow-y-auto space-y-4">
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px] font-mono border-campus-primary/50 text-campus-primary">
                    {selectedBuilding.code}
                  </Badge>
                  <span className="text-[11px] text-gray-400 uppercase font-medium">{selectedBuilding.category}</span>
                </div>
                <h3 className="text-base font-bold text-white leading-tight">{selectedBuilding.name}</h3>
                <div className="text-xs text-gray-400 mt-0.5">{selectedBuilding.architecturalStyle}</div>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <BuildingIcon className="w-3 h-3 text-campus-primary" />
                  Levels & Capacity
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  {selectedBuilding.floors} Floors ({selectedBuilding.capacity})
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-campus-primary" />
                  Operating Hours
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  {selectedBuilding.hours}
                </div>
              </div>
            </div>

            {/* Live Operational Status */}
            <div className="p-3 rounded-xl bg-campus-primary/10 border border-campus-primary/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-campus-primary animate-pulse" />
                  Telemetry Status
                </span>
                <Badge className="bg-campus-primary/30 text-campus-primary border-campus-primary/40 text-[10px]">
                  Synchronized
                </Badge>
              </div>
              <p className="text-xs text-gray-300">{selectedBuilding.status}</p>
            </div>

            {/* Overview Section */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Facility Overview</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{selectedBuilding.overview}</p>
            </div>

            {/* Departments */}
            {selectedBuilding.departments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Departments & Wings</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBuilding.departments.map((dept, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-md text-[11px] bg-white/5 border border-white/5 text-gray-300"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities */}
            {selectedBuilding.facilities.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Key Facilities</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  {selectedBuilding.facilities.map((fac, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-campus-primary" />
                      {fac}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Live Vacant Rooms Cross-Reference */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Vacant Rooms in this Building
                </h4>
                <Link href="/student/rooms" className="text-[10px] text-[#A51C30] hover:underline font-semibold flex items-center gap-0.5">
                  All Rooms <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="space-y-1.5">
                {getVacantRoomsStatus()
                  .filter((r) => r.room.building_id === selectedBuilding.id)
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={item.room.id}
                      className="p-2 rounded-lg bg-[#141424] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{item.room.room_number}</span>
                        <span className="text-[10px] text-gray-400">{item.room.name}</span>
                      </div>
                      {item.status === "FREED_BY_CANCELLATION" ? (
                        <Badge variant="warning" className="text-[9px] px-1.5 py-0.5">
                          Freed
                        </Badge>
                      ) : item.is_vacant ? (
                        <Badge variant="success" className="text-[9px] px-1.5 py-0.5">
                          Vacant
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="text-[9px] px-1.5 py-0.5">
                          In Class
                        </Badge>
                      )}
                    </div>
                  ))}
                {getVacantRoomsStatus().filter((r) => r.room.building_id === selectedBuilding.id).length === 0 && (
                  <p className="text-[11px] text-gray-400 italic">No assigned lecture rooms in this wing.</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2">
              <Button
                onClick={() => {
                  transitionCamera(selectedBuilding.focalPoint.camera, selectedBuilding.focalPoint.target, 1.2);
                }}
                className="flex-1 bg-campus-primary hover:bg-campus-primary/90 text-white text-xs gap-1.5"
                size="sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                Focus Camera
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNavPillClick("overview")}
                className="border-white/10 text-xs text-gray-300 hover:text-white"
                size="sm"
              >
                Reset View
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Fast-Travel Quick Dock */}
      <div className="hud-interactive absolute bottom-4 left-4 right-4 z-20 flex justify-center pointer-events-none">
        <div className="flex items-center gap-1 p-1 bg-campus-card/90 border border-white/10 rounded-full backdrop-blur-2xl shadow-2xl pointer-events-auto max-w-full overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleNavPillClick("overview")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeNavPill === "overview"
                ? "bg-campus-primary text-white shadow-md shadow-campus-primary/30"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Compass className="w-3 h-3" /> Overview
          </button>
          <button
            onClick={() => handleNavPillClick("gate")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeNavPill === "gate"
                ? "bg-campus-primary text-white shadow-md shadow-campus-primary/30"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Main Gate
          </button>
          <button
            onClick={() => handleNavPillClick("ssbas")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeNavPill === "ssbas"
                ? "bg-campus-primary text-white shadow-md shadow-campus-primary/30"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            KJSCE (SSBAS)
          </button>
          <button
            onClick={() => handleNavPillClick("library")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeNavPill === "library"
                ? "bg-campus-primary text-white shadow-md shadow-campus-primary/30"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Central Library
          </button>
          <button
            onClick={() => handleNavPillClick("canteen")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeNavPill === "canteen"
                ? "bg-campus-primary text-white shadow-md shadow-campus-primary/30"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Canteen
          </button>
          <button
            onClick={() => handleNavPillClick("sports")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeNavPill === "sports"
                ? "bg-campus-primary text-white shadow-md shadow-campus-primary/30"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Sports Academy
          </button>
        </div>
      </div>
    </div>
  );
}
