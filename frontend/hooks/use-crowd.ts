import { useEffect, useState, useCallback } from "react";
import { CrowdState, CrowdLevel } from "@/lib/types";
import { getDemoCrowdState, getCrowdLevel } from "@/lib/campus-data";

export function useCrowd() {
  const [crowdData, setCrowdData] = useState<Record<string, CrowdState>>({});
  const [buildingCrowd, setBuildingCrowd] = useState<Record<string, CrowdState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrowdData = async () => {
      try {
        setIsLoading(true);
        const data = getDemoCrowdState();

        const crowdMap: Record<string, CrowdState> = {};
        const buildingMap: Record<string, CrowdState> = {};

        data.forEach((state) => {
          crowdMap[state.locationId] = state;
          if (state.locationType === "building") {
            buildingMap[state.locationId] = state;
          }
        });

        setCrowdData(crowdMap);
        setBuildingCrowd(buildingMap);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load crowd data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCrowdData();
  }, []);

  const getCrowdState = useCallback(
    (locationId: string): CrowdState | undefined => {
      return crowdData[locationId] ?? buildingCrowd[locationId];
    },
    [crowdData, buildingCrowd]
  );

  const getLevel = useCallback(
    (locationId: string): CrowdLevel => {
      const state = getCrowdState(locationId);
      if (!state) return "low";
      return getCrowdLevel(state.count / state.capacity);
    },
    [getCrowdState]
  );

  const isGettingCrowded = useCallback(
    (locationId: string): boolean => {
      const state = getCrowdState(locationId);
      if (!state) return false;
      return state.count / state.capacity > 0.6;
    },
    [getCrowdState]
  );

  return {
    crowdData,
    buildingCrowd,
    isLoading,
    error,
    getCrowdState,
    getLevel,
    isGettingCrowded,
  };
}
