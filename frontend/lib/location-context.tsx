"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { LocationState, RushInfo, CampusLocationInfo } from "@/lib/constants";

type GeoError = {
  code: string;
  message: string;
};

interface LocationContextType {
  tracking: boolean;
  status: "LIVE" | "OFF" | "UNAVAILABLE" | "PERMISSION_DENIED";
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  lastTimestamp: string | null;
  matchedLocation: LocationState["matched_location"];
  permissionDenied: boolean;
  watchId: number | null;
  enableTracking: () => Promise<void>;
  disableTracking: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  error: string | null;
  rushData: RushInfo[] | null;
  campusLocations: CampusLocationInfo[] | null;
  isLoadingRush: boolean;
  fetchRush: () => Promise<any>;
  fetchCampusLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
}

const STALE_THRESHOLD_MS = 5 * 60 * 1000;
const GPS_TIME_THRESHOLD_MS = 10_000;
const GPS_DISTANCE_THRESHOLD_M = 10;
const GPS_ACCURACY_THRESHOLD_M = 100;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLam = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLam / 2) ** 2;
  return (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * R;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState<"LIVE" | "OFF" | "UNAVAILABLE" | "PERMISSION_DENIED">("OFF");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const [matchedLocation, setMatchedLocation] = useState<LocationState["matched_location"]>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [rushData, setRushData] = useState<RushInfo[] | null>(null);
  const [campusLocations, setCampusLocations] = useState<CampusLocationInfo[] | null>(null);
  const [isLoadingRush, setIsLoadingRush] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastSubmittedCoordsRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const lastRushFetchRef = useRef<number>(0);

  const fetchRush = useCallback(async () => {
    if (!user) return;
    setIsLoadingRush(true);
    const unsubscribe = api.location.subscribeRush((data: any) => {
      setRushData(data as RushInfo[]);
      setIsLoadingRush(false);
    });
    return unsubscribe;
  }, [user]);

  const fetchCampusLocations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.location.getLocations();
      setCampusLocations(data as any as CampusLocationInfo[]);
    } catch (err: any) {
      console.error("Failed to fetch campus locations:", err);
    }
  }, [user]);

  const refreshStatus = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.presence.getLocation() as any;
      setTracking(data.tracking_enabled);
      setStatus(data.location_status as "LIVE" | "OFF" | "UNAVAILABLE" | "PERMISSION_DENIED");
      setLatitude(data.latitude ?? null);
      setLongitude(data.longitude ?? null);
      setAccuracy(data.accuracy ?? null);
      setLastTimestamp(data.timestamp ?? null);
      setMatchedLocation(data.matched_location ?? null);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 403) {
        setTracking(false);
        setStatus("OFF");
      } else {
        setError(err?.message || "Failed to fetch location status");
      }
    }
  }, [user]);

  const shouldSubmitLocation = useCallback((lat: number, lng: number, acc: number, ts: number): boolean => {
    if (acc > GPS_ACCURACY_THRESHOLD_M) return false;
    const prev = lastSubmittedCoordsRef.current;
    if (!prev) return true;
    const timeDelta = ts - prev.ts;
    if (timeDelta < GPS_TIME_THRESHOLD_MS) return false;
    const dist = haversine(prev.lat, prev.lng, lat, lng);
    return dist >= GPS_DISTANCE_THRESHOLD_M;
  }, []);

  const submitLocation = useCallback(async (coords: { latitude: number; longitude: number; accuracy: number; timestamp: string }) => {
    try {
      const result = await api.location.submitLocation(coords) as any;
      if (result?.matched_location) {
        setMatchedLocation(result.matched_location);
      }
      setTracking(true);
      lastSubmittedCoordsRef.current = {
        lat: coords.latitude,
        lng: coords.longitude,
        ts: new Date(coords.timestamp).getTime(),
      };
    } catch (err: any) {
      if (err?.status === 403) {
        setError("Location tracking is disabled in your privacy settings. Enable location consent first.");
        setStatus("OFF");
        setTracking(false);
      } else {
        setError(err?.message || "Failed to submit location to server");
      }
    }
  }, []);

  const handlePositionSuccess = useCallback((pos: GeolocationPosition) => {
    const coords = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: new Date(pos.timestamp).toISOString(),
    };

    const ts = new Date(pos.timestamp).getTime();

    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setAccuracy(coords.accuracy);
    setLastTimestamp(coords.timestamp);
    setStatus("LIVE");
    setPermissionDenied(false);

    if (shouldSubmitLocation(coords.latitude, coords.longitude, coords.accuracy, ts)) {
      submitLocation(coords);
    }
  }, [shouldSubmitLocation, submitLocation]);

  const handleError = useCallback((geErr: GeolocationPositionError) => {
    if (geErr.code === 1) {
      setPermissionDenied(true);
      setStatus("PERMISSION_DENIED");
      setError("Location permission denied");
    } else if (geErr.code === 2) {
      setStatus("UNAVAILABLE");
      setError("Location unavailable");
    } else {
      setStatus("UNAVAILABLE");
      setError(geErr.message);
    }
  }, []);

  const enableTracking = useCallback(async () => {
    if (!user) return;
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setStatus("UNAVAILABLE");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionSuccess(pos);
        if (watchIdRef.current === null) {
          const id = navigator.geolocation.watchPosition(
            handlePositionSuccess,
            handleError,
            {
              enableHighAccuracy: true,
              maximumAge: 10000,
              timeout: 15000,
            }
          );
          watchIdRef.current = id;
          setWatchId(id);
        }
      },
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );
  }, [user, handlePositionSuccess, handleError]);

  const disableTracking = useCallback(async () => {
    if (!user) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setWatchId(null);
    }

    try {
      await api.location.disableTracking();
    } catch (err: any) {
      console.error("Failed to disable tracking:", err);
    }

    setTracking(false);
    setStatus("OFF");
    setLatitude(null);
    setLongitude(null);
    setAccuracy(null);
    setLastTimestamp(null);
    setMatchedLocation(null);
    setPermissionDenied(false);
    setError(null);
    lastSubmittedCoordsRef.current = null;
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshStatus();
      fetchCampusLocations();
      
      let unsubscribe: (() => void) | undefined;
      fetchRush().then(unsub => {
        if (unsub) unsubscribe = unsub;
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user, refreshStatus, fetchCampusLocations, fetchRush]);
  useEffect(() => {
    if (user && tracking && watchIdRef.current === null && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handleError,
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 15000,
        }
      );
      watchIdRef.current = id;
      setWatchId(id);

      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
          setWatchId(null);
        }
      };
    }
  }, [user, tracking, handlePositionSuccess, handleError]);

  // fetchRush is now managed via a single subscription effect on mount/user change

  const isStale =
    lastTimestamp &&
    Date.now() - new Date(lastTimestamp).getTime() > STALE_THRESHOLD_MS;

  const displayStatus: "LIVE" | "OFF" | "UNAVAILABLE" | "PERMISSION_DENIED" =
    tracking && isStale ? "UNAVAILABLE" : status;

  return (
    <LocationContext.Provider
      value={{
        tracking,
        status: displayStatus,
        latitude,
        longitude,
        accuracy,
        lastTimestamp,
        matchedLocation,
        permissionDenied,
        watchId,
        enableTracking,
        disableTracking,
        refreshStatus,
        error,
        rushData,
        campusLocations,
        isLoadingRush,
        fetchRush,
        fetchCampusLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}
