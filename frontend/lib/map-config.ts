import { MAP_CENTER, MAP_DEFAULT_ZOOM, MAP_STYLE } from "@/lib/constants";
import { Building, Room, Lift, Event as CampusEvent } from "@/lib/types";
import { DEMO_BUILDINGS } from "@/lib/constants";

export const MAP_CONFIG = {
  center: [MAP_CENTER.lng, MAP_CENTER.lat] as [number, number],
  zoom: MAP_DEFAULT_ZOOM,
  maxZoom: 20,
  minZoom: 14,
  pitch: 0,
  bearing: 0,
  style: MAP_STYLE,
  touchZoomRotate: true,
  scrollZoom: true,
  dragRotate: false,
  trackPadding: 50,
  attributionControl: false,
} as const;

export interface MapMarkerData {
  id: string;
  type: "building" | "room" | "lift" | "event" | "user" | "issue";
  coordinates: { lat: number; lng: number };
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  data?: Building | Room | Lift | CampusEvent | Record<string, unknown>;
}

export interface MapLayerConfig {
  id: string;
  type: string;
  source: string;
  "source-layer"?: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: Array<unknown>;
  minzoom?: number;
  maxzoom?: number;
}

export const MAP_LAYERS: MapLayerConfig[] = [
  {
    id: "background",
    type: "background",
    source: "composite",
    paint: {
      "background-color": "#F7F7F7",
    },
  },
];

export const MAP_CONTROLS = {
  showNorth: false,
  showScale: true,
  showZoom: true,
  showCompass: true,
  showAttribution: false,
} as const;

export const BUILDING_MARKER_COLORS = {
  operational: "#16855B",
  maintenance: "#B7791F",
  closed: "#B42318",
} as const;

export const CROWD_HEATMAP_COLORS = [
  "#A51C30",
  "#16855B",
  "#B7791F",
  "#B42318",
] as const;

export function getBuildingMarkers(buildings: Building[]): MapMarkerData[] {
  return buildings.map((building) => ({
    id: building.id,
    type: "building" as const,
    coordinates: building.coordinates,
    title: building.name,
    subtitle: building.code,
    icon: "building",
    color: BUILDING_MARKER_COLORS[building.status],
    data: building,
  }));
}

export function getEventMarkers(events: CampusEvent[]): MapMarkerData[] {
  return events.map((event) => ({
    id: event.id,
    type: "event" as const,
    coordinates: event.coordinates,
    title: event.title,
    subtitle: event.type,
    icon: "calendar",
    color: "#A51C30",
    data: event,
  }));
}

export function getDefaultMarkers(): MapMarkerData[] {
  return [
    ...getBuildingMarkers(DEMO_BUILDINGS),
    ...getEventMarkers([]),
  ];
}

export { DEMO_BUILDINGS };
