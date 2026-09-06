"use client";

import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Html } from "@react-three/drei";
import * as THREE from "three";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Play, Pause, RefreshCw, AlertTriangle, CheckCircle2, User, Zap, Sparkles, MapPin } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useLocation } from "@/lib/location-context";

interface BuildingState {
  status: string;
  occupancy: number;
  issues: number;
  lift_status?: string;
  delay_note?: string;
}

const WAYPOINTS: [number, number, number][] = [
  [2.5, 0.15, 0],
  [1.2, 0.15, 0],
  [0, 0.15, 0],
  [-1.2, 0.15, 0],
  [-2.5, 0.15, 0],
  [-1.2, 0.15, -1.2],
  [0, 0.15, -2.5],
  [1.2, 0.15, -1.2],
  [2.5, 0.15, 0],
];

function WalkingAvatar({ isWalking, speedMultiplier = 1, onPositionUpdate }: { isWalking: boolean; speedMultiplier: number; onPositionUpdate: (pos: [number, number, number]) => void }) {
  const avatarRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const lastUpdateRef = useRef(0);

  useFrame((_, delta) => {
    if (!isWalking || !avatarRef.current) return;

    progressRef.current = (progressRef.current + delta * 0.25 * speedMultiplier) % (WAYPOINTS.length - 1);
    const index = Math.floor(progressRef.current);
    const subProgress = progressRef.current - index;

    const p1 = new THREE.Vector3(...WAYPOINTS[index]);
    const p2 = new THREE.Vector3(...WAYPOINTS[index + 1]);

    const currentPos = new THREE.Vector3().lerpVectors(p1, p2, subProgress);
    avatarRef.current.position.copy(currentPos);

    const now = Date.now();
    if (now - lastUpdateRef.current >= 1000) {
      lastUpdateRef.current = now;
      onPositionUpdate([
        parseFloat(currentPos.x.toFixed(2)),
        parseFloat(currentPos.y.toFixed(2)),
        parseFloat(currentPos.z.toFixed(2)),
      ]);
    }
  });

  return (
    <group ref={avatarRef} position={[2.5, 0.15, 0]}>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#A51C30" emissive="#A51C30" emissiveIntensity={0.8} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#F5E7EA" />
      </mesh>
      <Html position={[0, 0.85, 0]} center distanceFactor={12}>
        <div className="bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap border border-red-500/50 shadow-lg pointer-events-none">
          Arjun (MCA) • Walking
        </div>
      </Html>
    </group>
  );
}

function CampusBuilding({ id, name, color, position, floors, isSelected, liftStatus, onClick }: any) {
  const height = 0.6 + floors * 0.22;

  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, height, 1.2]} />
        <meshStandardMaterial
          color={isSelected ? "#8F1728" : color}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, height + 0.05, 0]}>
        <boxGeometry args={[1.45, 0.08, 1.25]} />
        <meshStandardMaterial color="#D9D9D9" />
      </mesh>
      {liftStatus === "maintenance" && (
        <mesh position={[0.5, height + 0.3, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#B42318" emissive="#B42318" emissiveIntensity={1} />
          <Html position={[0, 0.25, 0]} center distanceFactor={10}>
            <span className="bg-red-600/90 text-white text-[9px] px-1.5 py-0.5 rounded border border-red-400 font-bold whitespace-nowrap">
              Lift 2 Fault
            </span>
          </Html>
        </mesh>
      )}
      <Html position={[0, height + 0.25, 0]} center distanceFactor={14}>
        <div className="bg-slate-900/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded border border-white/20 whitespace-nowrap shadow-md pointer-events-none">
          {name}
        </div>
      </Html>
    </group>
  );
}

function PathwayLine() {
  const points = WAYPOINTS.map((w) => new THREE.Vector3(...w));
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: "#A51C30" }))} />
  );
}

function DigitalTwinScene({ selectedBuilding, onSelect, isWalking, speedMultiplier, onPositionUpdate, buildings, lifts }: any) {
  const buildingMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const b of buildings) {
      const code = (b.code || b.name || "").toLowerCase();
      if (code.includes("ssbas") || code.includes("computer science")) map["ssbas"] = b;
      else if (code.includes("aurobindo")) map["aurobindo"] = b;
      else if (code.includes("bhaskaracharya")) map["bhaskaracharya"] = b;
      else if (code.includes("library")) map["library"] = b;
      else if (code.includes("gargi") || code.includes("plaza")) map["gargi"] = b;
    }
    return map;
  }, [buildings]);

  const defaultBuildings = [
    { id: "ssbas", name: "Computer Science (SSBAS)", color: "#A51C30", position: [-2.5, 0, 0] as [number, number, number], floors: 4 },
    { id: "aurobindo", name: "Aurobindo Building", color: "#8F1728", position: [0, 0, 0] as [number, number, number], floors: 4 },
    { id: "bhaskaracharya", name: "Bhaskaracharya Block", color: "#8F1728", position: [2.5, 0, 0] as [number, number, number], floors: 5 },
    { id: "library", name: "Central Library", color: "#640D10", position: [0, 0, -2.5] as [number, number, number], floors: 3 },
    { id: "gargi", name: "Gargi Plaza", color: "#A51C30", position: [0, 0, 2.5] as [number, number, number], floors: 1 },
  ];

  const displayBuildings = buildingMap && Object.keys(buildingMap).length > 0
    ? defaultBuildings.map((b) => {
        const db = buildingMap[b.id];
        return {
          ...b,
          id: db?.id || b.id,
          name: db?.name || b.name,
          floors: db?.num_floors || b.floors,
        };
      })
    : defaultBuildings;

  const liftStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const lift of lifts) {
      const buildingCode = `building_${lift.building_id}`;
      if (lift.status === "maintenance" || lift.status === "unavailable") {
        map[buildingCode] = "maintenance";
      }
    }
    return map;
  }, [lifts]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[12, 16, 8]} intensity={1.0} castShadow />
      <pointLight position={[-8, -8, -8]} intensity={0.4} />

      <Grid
        position={[0, -0.01, 0]}
        args={[24, 24]}
        cellSize={0.5}
        cellThickness={1}
        sectionSize={2.5}
        sectionThickness={1.5}
        fadeDistance={25}
        infiniteGrid
      />

      <PathwayLine />

      <WalkingAvatar
        isWalking={isWalking}
        speedMultiplier={speedMultiplier}
        onPositionUpdate={onPositionUpdate}
      />

      {displayBuildings.map((b) => (
        <CampusBuilding
          key={b.id}
          {...b}
          isSelected={selectedBuilding === b.id}
          liftStatus={liftStatusMap[`building_${b.id}`] || "operational"}
          onClick={() => onSelect(b.id)}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={22}
      />
    </>
  );
}

export default function DigitalTwinPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>("ssbas");
  const [states, setStates] = useState<Record<string, BuildingState>>({});
  const [isWalking, setIsWalking] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [currentCoords, setCurrentCoords] = useState<[number, number, number]>([2.5, 0.15, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [lifts, setLifts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [campusLocations, setCampusLocations] = useState<any[]>([]);
  const [rushData, setRushData] = useState<any[]>([]);
  const [rushLoading, setRushLoading] = useState(false);

  const { tracking, status: locStatus, latitude, longitude } = useLocation();

  useEffect(() => {
    async function loadState() {
      setLoading(true);
      setError(null);
       try {
        const [twinData, rushResult] = await Promise.all([
          apiClient.get<any>("/digital-twin/state"),
          apiClient.get<any[]>("/location/rush").catch(() => []),
        ]);
        const data = twinData;
        setBuildings(data.buildings || []);
        setRooms(data.rooms || []);
        setIssues(data.issues || []);
        setLifts(data.lifts || []);
        setEvents(data.events || []);
        setCampusLocations(data.campus_locations || []);
        setRushData(rushResult || []);

          const stateMap: Record<string, BuildingState> = {};

          const buildingRushMap: Record<string, any> = {};
          for (const rush of (rushResult || [])) {
            if (rush.location_name) {
              buildingRushMap[rush.location_name.toLowerCase()] = rush;
            }
          }

          for (const b of data.buildings || []) {
            const bldIssues = (data.issues || []).filter((iss: any) => {
              const loc = (data.campus_locations || []).find((l: any) => l.id === iss.location_id);
              return loc && loc.building_id === b.id;
            });
            const buildingLifts = (data.lifts || []).filter((l: any) => l.building_id === b.id);
            const hasMaintenance = buildingLifts.some((l: any) => l.status === "maintenance" || l.status === "unavailable");

            const bldNameLower = String(b.name || "").toLowerCase();
            let rushMatch: any = null;
            for (const [key, val] of Object.entries(buildingRushMap)) {
              if (bldNameLower.includes(key) || key.includes(bldNameLower.split(" ")[0])) {
                rushMatch = val;
                break;
              }
            }

            const occupancy = rushMatch
              ? Math.round((rushMatch.current_count / (rushMatch.capacity || rushMatch.current_count + 1)) * 100)
              : 0;

            stateMap[b.id] = {
              status: b.status || "operational",
              occupancy,
              issues: bldIssues.length,
              lift_status: hasMaintenance ? "maintenance" : "operational",
              delay_note: hasMaintenance ? "Lift under maintenance (+4 min transit delay)" : "All systems green",
            };
          }
          setStates(stateMap);
      } catch (err: any) {
        setError(err?.message || "Failed to load digital twin state");
      } finally {
        setLoading(false);
      }
    }
    loadState();
  }, []);

  const defaultBuildings = [
    { id: "ssbas", name: "Computer Science (SSBAS)", color: "#A51C30", position: [-2.5, 0, 0] as [number, number, number], floors: 4 },
    { id: "aurobindo", name: "Aurobindo Building", color: "#8F1728", position: [0, 0, 0] as [number, number, number], floors: 4 },
    { id: "bhaskaracharya", name: "Bhaskaracharya Block", color: "#8F1728", position: [2.5, 0, 0] as [number, number, number], floors: 5 },
    { id: "library", name: "Central Library", color: "#640D10", position: [0, 0, -2.5] as [number, number, number], floors: 3 },
    { id: "gargi", name: "Gargi Plaza", color: "#A51C30", position: [0, 0, 2.5] as [number, number, number], floors: 1 },
  ];

  const selectedData = selectedBuilding ? states[selectedBuilding] : null;
  const selectedBldObj = buildings.find((b: any) => String(b.id) === selectedBuilding) ||
    defaultBuildings.find((b) => b.id === selectedBuilding);

  const refreshState = async () => {
    try {
      const [twinData, rushResult] = await Promise.all([
        apiClient.get<any>("/digital-twin/state"),
        apiClient.get<any[]>("/location/rush").catch(() => []),
      ]);
      setBuildings(twinData.buildings || []);
      setRooms(twinData.rooms || []);
      setIssues(twinData.issues || []);
      setLifts(twinData.lifts || []);
      setEvents(twinData.events || []);
      setCampusLocations(twinData.campus_locations || []);
      setRushData(rushResult || []);
    } catch {
      //
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
        <div className="flex items-center gap-2">
          <Badge variant="success" className="animate-pulse">Live Digital Twin</Badge>
          <Badge variant="secondary">Somaiya Campus Spatial Twin</Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Campus Digital Twin</h1>
          <p className="text-gray-400">Interactive 3D spatial simulation with animated agent navigation and live backend state</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={refreshState}
            variant="outline"
            className="text-xs border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsWalking(!isWalking)}
            className={`text-xs flex items-center gap-1.5 ${
              isWalking ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isWalking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isWalking ? "Pause" : "Resume"}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
            className="text-xs border-white/10 text-white hover:bg-white/10"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400 mr-1" />
            {speedMultiplier}x
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading digital twin state from backend...
        </div>
      )}

      {!loading && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[450px]">
          <div className="lg:col-span-2 h-[450px] lg:h-full">
            <Card className="h-full border-white/10 relative overflow-hidden bg-slate-950">
              <Suspense fallback={<div className="h-full flex items-center justify-center text-white text-sm">Loading 3D Campus Digital Twin...</div>}>
                <Canvas
                  camera={{ position: [6, 7, 7], fov: 48 }}
                  shadows
                  gl={{ preserveDrawingBuffer: true }}
                >
                  <Environment preset="city" />
                  <DigitalTwinScene
                    selectedBuilding={selectedBuilding}
                    onSelect={setSelectedBuilding}
                    isWalking={isWalking}
                    speedMultiplier={speedMultiplier}
                    onPositionUpdate={setCurrentCoords}
                    buildings={buildings}
                    lifts={lifts}
                  />
                </Canvas>
              </Suspense>

              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur border border-white/10 rounded-xl p-3 text-xs space-y-1 text-gray-300 pointer-events-none">
                <p className="text-white font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-red-500" /> Walking Agent Telemetry
                </p>
                <p>Target: <span className="text-white">CSB 302 (DBMS Lecture)</span></p>
                <p>Path Coordinates: <span className="text-amber-400 font-mono">[{currentCoords.join(", ")}]</span></p>
                <p>Mode: <span className="text-emerald-400 font-bold">SIMULATION</span></p>
              </div>

              <div className="absolute top-3 right-3 bg-black/75 backdrop-blur border border-white/10 rounded-xl p-3 text-xs space-y-1 text-gray-300 pointer-events-none">
                <p className="text-white font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Real GPS Presence
                </p>
                <p>Your Status: <span className={`font-bold ${status === "LIVE" ? "text-emerald-400" : "text-gray-400"}`}>{status}</span></p>
                {latitude != null && longitude != null && (
                  <p>Coordinates: <span className="text-white font-mono">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span></p>
                )}
                <p>
                  <span className="text-gray-400">Last Updated:</span>{" "}
                  <span className="text-white">{new Date().toLocaleTimeString()}</span>
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <Card className="p-5 border-white/10 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center justify-between">
                <span>{selectedBldObj?.name || "Selected Facility"}</span>
                <Badge variant={selectedData?.status === "operational" ? "success" : "danger"}>
                  {selectedData?.status || "unknown"}
                </Badge>
              </h3>

              {selectedData && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Occupancy Ratio</span>
                    <span className="text-white font-semibold">{selectedData.occupancy}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Rush Source</span>
                    <span className={`font-semibold ${
                      rushData.find((r: any) => r.location_name?.toLowerCase().includes(String(selectedBldObj?.name || "").toLowerCase().split(" ")[0]))?.source === "GPS"
                        ? "text-emerald-400"
                        : rushData.find((r: any) => r.location_name?.toLowerCase().includes(String(selectedBldObj?.name || "").toLowerCase().split(" ")[0]))?.source === "ADMIN_OVERRIDE"
                        ? "text-amber-400"
                        : "text-gray-400"
                    }`}>
                    {rushData.find((r: any) => r.location_name?.toLowerCase().includes(String(selectedBldObj?.name || "").toLowerCase().split(" ")[0]))?.source || "SIMULATION"}
                  </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Reported Incidents</span>
                    <span className="text-white font-semibold">{selectedData.issues}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Elevator Telemetry</span>
                    <Badge variant={selectedData.lift_status === "maintenance" ? "danger" : "success"}>
                      {selectedData.lift_status}
                    </Badge>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 text-gray-300">
                    <span className="text-gray-400 block mb-0.5">Spatial Advisory:</span>
                    {selectedData.delay_note}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/10 space-y-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Campus State Summary</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Buildings</span>
                    <span className="text-white font-semibold">{buildings.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Rooms</span>
                    <span className="text-white font-semibold">{rooms.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Issues</span>
                    <span className="text-white font-semibold">{issues.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Events</span>
                    <span className="text-white font-semibold">{events.length}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-white/10">
              <h3 className="font-bold text-white mb-2 text-base">System Status</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Data Source</span>
                  <span className="text-emerald-400 font-semibold">Backend API</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Simulation Engine</span>
                  <span className="text-emerald-400 font-semibold">Three.js + R3F</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Agent Navigation</span>
                  <span className="text-purple-400 font-semibold">Live Waypoint Walk</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Last Updated</span>
                  <span className="text-white font-semibold">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
