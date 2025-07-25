import React from "react";

const Avatar = ({ name, src, className = "" }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${className}`.trim()}
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div
      className={`bg-blue-500 text-white flex items-center justify-center rounded-full font-bold ${className}`.trim()}
    >
      {initial}
    </div>
  );
};

export default Avatar;
