import { useState, useEffect, useCallback } from "react";
import { Route, NavigationResult } from "@/lib/types";
import { MAP_CENTER } from "@/lib/constants";

export interface UseNavigationOptions {
  start?: { lat: number; lng: number };
  end?: { lat: number; lng: number };
}

export function useNavigation(options?: UseNavigationOptions) {
  const [route, setRoute] = useState<Route | null>(null);
  const [navigationResult, setNavigationResult] = useState<NavigationResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPoint = options?.start ?? {
    lat: MAP_CENTER.lat,
    lng: MAP_CENTER.lng,
  };

  const calculateRoute = useCallback(
    async (
      start: { lat: number; lng: number },
      end: { lat: number; lng: number }
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const fallbackRoute: Route = {
          id: `route_${Date.now()}`,
          waypoints: [
            { lat: start.lat, lng: start.lng, type: "start", name: "Start" },
            { lat: end.lat, lng: end.lng, type: "end", name: "Destination" },
          ],
          distance:
            Math.sqrt(
              Math.pow(end.lat - start.lat, 2) +
                Math.pow(end.lng - start.lng, 2)
            ) * 111000,
          duration: 10,
          polyline: JSON.stringify([[start.lng, start.lat], [end.lng, end.lat]]),
        };

        setRoute(fallbackRoute);

        const result: NavigationResult = {
          route: fallbackRoute,
          currentStep: 0,
          nextStep: {
            instruction: "Head to your destination",
            distance: fallbackRoute.distance,
            duration: fallbackRoute.duration,
          },
          remainingDistance: fallbackRoute.distance,
          remainingDuration: fallbackRoute.duration,
        };

        setNavigationResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const nextStep = useCallback(() => {
    if (!navigationResult) return;

    const newStep = navigationResult.currentStep + 1;
    const remainingDistance = navigationResult.remainingDistance - 100;
    const remainingDuration = navigationResult.remainingDuration - 60;

    setNavigationResult({
      ...navigationResult,
      currentStep: newStep,
      remainingDistance: Math.max(0, remainingDistance),
      remainingDuration: Math.max(0, remainingDuration),
    });
  }, [navigationResult]);

  return {
    route,
    navigationResult,
    isLoading,
    error,
    startPoint,
    calculateRoute,
    nextStep,
  };
}
