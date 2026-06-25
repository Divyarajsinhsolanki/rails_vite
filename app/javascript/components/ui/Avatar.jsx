import React from "react";

const Avatar = ({ name, src, className = "" }) => {
  const hasValidSrc = src && src !== "null" && src !== "";
  const displayName = (name || "").trim();
  const altText = displayName ? `${displayName}'s avatar` : "User avatar";

  if (hasValidSrc) {
    return (
      <img
        src={src}
        alt={altText}
        className={`rounded-full object-cover ${className}`.trim()}
      loading="lazy" />
    );
  }

  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-theme font-bold text-white ${className}`.trim()}
      aria-label={altText}
    >
      {initial}
    </div>
  );
};

export default Avatar;
