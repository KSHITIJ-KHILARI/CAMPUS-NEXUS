"use client";

import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Clock, Navigation, Route, Car, CarFront, User } from "lucide-react";
import { NavigationResult, Route as RouteType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

export interface RoutePanelProps {
  route?: RouteType;
  navigationResult?: NavigationResult;
  isLoading?: boolean;
  onStopNavigation?: () => void;
  onNextStep?: () => void;
  showControls?: boolean;
  className?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  icon: React.ReactNode;
}

const RoutePanel = forwardRef<HTMLDivElement, RoutePanelProps>(
  (
    {
      route,
      navigationResult,
      isLoading,
      onStopNavigation,
      onNextStep,
      showControls = true,
      className,
    },
    ref
  ) => {
    const [showFullRoute, setShowFullRoute] = useState(false);

    const distance = navigationResult?.remainingDistance ?? route?.distance ?? 0;
    const duration = navigationResult?.remainingDuration ?? route?.duration ?? 0;
    const step = navigationResult?.nextStep ?? {
      instruction: "Head to your destination",
      distance: distance,
      duration: duration,
    };

    const steps: RouteStep[] = [
      {
        instruction: "Start",
        distance: 0,
        duration: 0,
        icon: <Navigation className="h-4 w-4" />,
      },
      ...(route?.waypoints?.slice(1).map((wp, i) => ({
        instruction: wp.name ?? `Waypoint ${i + 1}`,
        distance: (distance / (route.waypoints.length - 1)) * (i + 1),
        duration: (duration / (route.waypoints.length - 1)) * (i + 1),
        icon: <Car className="h-4 w-4" />,
      })) ?? []),
    ];

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full flex-col rounded-xl border border-surface-700 bg-surface-900/50 p-4",
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-100">
            Route to Destination
          </h3>
          {showFullRoute && (
            <Badge variant="secondary" className="text-xs">
              {route?.waypoints?.length ?? 0} stops
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-surface-500">
            Calculating route...
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-lg bg-surface-800/50 p-3">
              <div className="flex items-center gap-2 text-sm text-surface-300">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(duration)}</span>
                <span>·</span>
                <span>{Math.round(distance)} m</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-surface-200">
                {step.instruction}
              </p>
              <p className="text-xs text-surface-500">
                {Math.round(step.distance)} m · {formatDuration(step.duration)}
              </p>
            </div>

            {showFullRoute && (
              <div className="space-y-2 overflow-y-auto">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-800">
                      {s.icon}
                    </div>
                    <span className="text-surface-300">{s.instruction}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto pt-4">
              {showControls && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowFullRoute(!showFullRoute)}
                  >
                    <Route className="mr-2 h-4 w-4" />
                    {showFullRoute ? "Hide" : "Show"} Route
                  </Button>
                  {onNextStep && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={onNextStep}
                    >
                      <CarFront className="mr-2 h-4 w-4" />
                      Next Step
                    </Button>
                  )}
                  {onStopNavigation && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onStopNavigation}
                    >
                      Stop
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
);
RoutePanel.displayName = "RoutePanel";

export { RoutePanel };
