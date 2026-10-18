import React from "react";

export const LeftPanel: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <aside className={className ?? "p-4 bg-gray-100"}>
      {/* Placeholder for navigation or filters */}
      <h2 className="text-lg font-semibold mb-2">Menu</h2>
      <ul className="space-y-1">
        <li><a href="#" className="text-blue-600 hover:underline">Dashboard</a></li>
        <li><a href="#" className="text-blue-600 hover:underline">Trains</a></li>
        <li><a href="#" className="text-blue-600 hover:underline">Stations</a></li>
      </ul>
    </aside>
  );
};
