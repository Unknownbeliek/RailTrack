import React from "react";

export const RightToolbar: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <aside className={className ?? "p-4 bg-gray-100"}>
      {/* Placeholder for toolbar actions */}
      <h2 className="text-lg font-semibold mb-2">Tools</h2>
      <div className="space-y-2">
        <button className="w-full bg-blue-600 text-white py-1 rounded">Action 1</button>
        <button className="w-full bg-blue-600 text-white py-1 rounded">Action 2</button>
      </div>
    </aside>
  );
};
