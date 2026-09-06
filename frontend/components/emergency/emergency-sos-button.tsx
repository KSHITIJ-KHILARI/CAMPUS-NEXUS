"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmergencyModal } from "@/components/emergency/emergency-modal";

export function EmergencySOSButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-red-600 p-0 shadow-lg hover:bg-red-700 animate-pulse"
        title="NEXUS Emergency SOS"
      >
        <span className="text-lg font-bold text-white">SOS</span>
      </Button>

      <EmergencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReported={() => setIsModalOpen(false)}
      />
    </>
  );
}
