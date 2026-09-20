/** Artwork bounds, not texture padding, determine the responsive camera. */
export function studioFrame(width: number, height: number, count: number, zoom = 1, pan = { x: 0, y: 0 }) {
  const rows = Math.ceil(Math.max(0, count - 6) / 4);
  const fullHeight = 670 + rows * 240 + (rows ? 40 : 0);
  const scale = Math.min(width / 1030, height / (fullHeight - 24)) * zoom;
  return {
    scale,
    x: (width - 1030 * scale) / 2 - 45 * scale + pan.x,
    y: (height - (fullHeight - 24) * scale) / 2 - 24 * scale + pan.y,
  };
}

export function captionScale(cameraScale: number, count: number) {
  // Dense rosters retain spacing; their full names remain in the keyboard roster.
  return Math.min(count > 6 ? 1.4 : Infinity, Math.max(1, 0.7 / cameraScale));
}
