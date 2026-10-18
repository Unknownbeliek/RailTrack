import React from "react";
import { LeftPanel } from "./LeftPanel";
import { RightToolbar } from "./RightToolbar";
import { Topbar } from "./Topbar";
import { MapViewEnhancements } from "./MapViewEnhancements";

export const Shell: React.FC = () => {
  return (
    <div className="flex flex-col h-screen">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel className="w-64 flex-shrink-0 border-r border-gray-200" />
        <div className="flex-1 relative">
          <MapViewEnhancements />
        </div>
        <RightToolbar className="w-48 flex-shrink-0 border-l border-gray-200" />
      </div>
    </div>
  );
};
