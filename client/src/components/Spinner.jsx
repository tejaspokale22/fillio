import React from "react";

const Spinner = ({ size = 18 }) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className="animate-spin rounded-full border-3 border-gray-300 border-t-white"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      ></div>
    </div>
  );
};

export default Spinner;
