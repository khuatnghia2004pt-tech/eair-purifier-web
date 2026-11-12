const D = "M15 70 A45 45 0 0 1 105 70";
export const gaugeSVG = (id, color) =>
 `<svg viewBox="0 0 120 80"><path d="${D}" fill="none" stroke="#1b3a58" stroke-width="10" stroke-linecap="round"/>
  <path id="${id}" d="${D}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/></svg>`;
export const setGauge = (id, frac) => {
  const el = document.getElementById(id);
  if (el) el.setAttribute("stroke-dasharray", `${Math.max(0, Math.min(1, frac)) * 100} 100`);
};
