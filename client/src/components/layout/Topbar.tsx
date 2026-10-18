import React from "react";

export const Topbar: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <header className={className ?? "flex items-center justify-between p-4 bg-gray-800 text-white"}>
      <h1 className="text-xl font-bold">RailTrack India</h1>
      {/* Placeholder for user/profile actions */}
      <div className="flex space-x-2">
        <button className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">Login</button>
        <button className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">Settings</button>
      </div>
    </header>
  );
};
