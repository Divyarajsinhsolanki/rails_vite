export const COLOR_MAP = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#10b981',
  red: '#ef4444',
  pink: '#ec4899',
  indigo: '#6366f1'
};

export const lightenColor = (color, amount = 0.5) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
};

export const darkenColor = (color, amount = 0.25) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const nr = Math.round(r * (1 - amount));
  const ng = Math.round(g * (1 - amount));
  const nb = Math.round(b * (1 - amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
};

export const toRgb = (color) => {
  const temp = document.createElement('div');
  temp.style.color = color;
  document.body.appendChild(temp);
  const match = getComputedStyle(temp).color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  document.body.removeChild(temp);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : '59 130 246';
};
