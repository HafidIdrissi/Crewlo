import { ellipse, round } from "./clayArt";

export const STUDIO_WIDTH = 1120;
export const STUDIO_HEIGHT = 670;
/** Three-quarter projection shared by architecture, furniture and seats. */
export const project = (x: number, y: number): [number, number] => [
  560 + (x - y) * 0.85,
  175 + (x + y) * 0.4,
];

export function studioCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 2240;
  canvas.height = 1340;
  const c = canvas.getContext("2d")!;
  c.scale(2, 2);
  function polygon(points: number[][], color: string) {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }
  function plane(
    x: number,
    y: number,
    w: number,
    d: number,
    z: number,
    color: string,
  ) {
    polygon(
      [
        [x, y],
        [x + w, y],
        [x + w, y + d],
        [x, y + d],
      ].map(([a, b]) => {
        const p = project(a, b);
        return [p[0], p[1] - z];
      }),
      color,
    );
  }
  function box(
    x: number,
    y: number,
    w: number,
    d: number,
    z: number,
    h: number,
    top: string,
    side = "#c4a281",
  ) {
    const a = project(x, y + d),
      b = project(x + w, y + d),
      e = project(x + w, y);
    polygon(
      [
        [a[0], a[1] - z],
        [b[0], b[1] - z],
        [b[0], b[1] - z - h],
        [a[0], a[1] - z - h],
      ],
      side,
    );
    polygon(
      [
        [b[0], b[1] - z],
        [e[0], e[1] - z],
        [e[0], e[1] - z - h],
        [b[0], b[1] - z - h],
      ],
      "#b39273",
    );
    plane(x, y, w, d, z + h, top);
  }
  function plant(x: number, y: number, size = 1) {
    const [px, py] = project(x, y);
    c.save();
    c.translate(px, py);
    c.scale(size, size);
    ellipse(c, 0, 2, 25, 8, "#59443218");
    round(c, -16, -29, 32, 31, 9, "#ba795a");
    ellipse(c, 0, -28, 16, 7, "#d89875");
    c.strokeStyle = "#597057";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(0, -25);
    c.lineTo(0, -81);
    c.stroke();
    for (let i = 0; i < 6; i++) {
      c.save();
      c.translate(i % 2 ? -8 : 8, -40 - i * 7);
      c.rotate(i % 2 ? -0.7 : 0.7);
      ellipse(c, 0, 0, 9, 19, i % 2 ? "#708b67" : "#91a580");
      c.restore();
    }
    c.restore();
  }
  function table(x: number, y: number, w: number, d: number) {
    plane(x + 5, y + 5, w + 7, d + 7, 0, "#705f4c12");
    for (const [a, b] of [
      [x + 10, y + 10],
      [x + w - 15, y + 10],
      [x + 10, y + d - 12],
      [x + w - 15, y + d - 12],
    ])
      box(a, b, 7, 7, 0, 51, "#ad8564");
    box(x, y, w, d, 51, 8, "#e5c29a");
    plane(x + 3, y + 3, w - 6, d - 6, 60, "#eacfaa");
  }
  function monitor(x: number, y: number) {
    const [a, b] = project(x, y);
    ellipse(c, a, b - 57, 17, 5, "#ad9578");
    round(c, a - 3, b - 90, 6, 30, 2, "#7d8681");
    round(c, a - 31, b - 122, 62, 41, 6, "#485b5b");
    round(c, a - 26, b - 117, 52, 30, 3, "#aec4c0");
    // Static blank application framing, never simulated code or progress.
    round(c, a - 21, b - 111, 13, 20, 2, "#93aaa7");
    round(c, a - 4, b - 111, 25, 4, 2, "#dce4da");
    plane(x - 15, y + 25, 38, 14, 61, "#f2e9db");
  }
  c.save();
  c.shadowColor = "#69544028";
  c.shadowBlur = 35;
  c.shadowOffsetY = 24;
  box(0, 0, 570, 570, -18, 18, "#ebdfcb", "#c9b59a");
  c.restore();
  // Open back walls: plaster, wooden skirting, generous daylight.
  const left = project(0, 570),
    back = project(0, 0),
    right = project(570, 0);
  polygon(
    [
      [left[0], left[1]],
      [back[0], back[1]],
      [back[0], back[1] - 132],
      [left[0], left[1] - 132],
    ],
    "#e8ddcb",
  );
  polygon(
    [
      [back[0], back[1]],
      [right[0], right[1]],
      [right[0], right[1] - 132],
      [back[0], back[1] - 132],
    ],
    "#f6eddf",
  );
  for (let i = 35; i < 570; i += 35) {
    const a = project(i, 0),
      b = project(i, 570);
    c.beginPath();
    c.moveTo(...a);
    c.lineTo(...b);
    c.strokeStyle = "#c7b39435";
    c.lineWidth = 1;
    c.stroke();
  }
  // Tall blue window, following the wall's projection.
  polygon(
    [
      [668, 109],
      [898, 217],
      [898, 285],
      [668, 177],
    ],
    "#c6d5d1",
  );
  c.strokeStyle = "#fcf7eb";
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(782, 164);
  c.lineTo(782, 232);
  c.moveTo(670, 146);
  c.lineTo(895, 252);
  c.stroke();
  // Design pinboard and original abstract sketches.
  c.save();
  c.translate(238, 220);
  c.transform(1, -0.47, 0, 1, 0, 0);
  round(c, 0, 0, 175, 87, 5, "#b89b78");
  round(c, 5, 5, 165, 77, 3, "#f9f3e5");
  for (let i = 0; i < 3; i++) {
    round(c, 14 + i * 50, 16, 41, 52, 2, "#e6d7bc");
    round(c, 19 + i * 50, 22, 31, 40, 2, ["#c99880", "#afc0a1", "#a9bdcc"][i]);
  }
  c.restore();
  // Shelving with books, pots and a lamp.
  box(375, 18, 150, 37, 0, 74, "#dbc19f");
  for (let i = 0; i < 9; i++)
    box(
      385 + i * 13,
      25,
      9,
      24,
      74,
      18 + (i % 3) * 7,
      ["#7f9789", "#bc8269", "#e9dfc6", "#8196a3"][i % 4],
    );
  plant(525, 55, 0.8);
  plant(35, 65, 1.1);
  plant(38, 500, 1.1);
  plant(550, 485, 0.9);
  // Muted rugs ground each visual zone; no team boundaries.
  plane(45, 170, 185, 210, 1, "#c9d1bb");
  plane(315, 110, 195, 250, 1, "#c6d1d3");
  plane(220, 360, 210, 160, 1, "#d6b19a");
  table(70, 190, 140, 82);
  table(340, 140, 145, 82);
  plane(85, 202, 36, 25, 61, "#fbf4e7");
  plane(132, 214, 42, 30, 61, "#f9f0df");
  plane(140, 220, 24, 18, 62, "#c18a74");
  monitor(375, 164);
  monitor(445, 178);
  // Central meeting table and four upholstered stools.
  for (const [x, y] of [
    [250, 370],
    [360, 370],
    [250, 495],
    [360, 495],
  ]) {
    const [a, b] = project(x, y);
    round(c, a - 4, b - 24, 8, 24, 3, "#967658");
    ellipse(c, a, b - 26, 22, 11, "#899986");
    ellipse(c, a, b - 30, 22, 11, "#a5b29a");
  }
  table(250, 405, 130, 65);
  plane(282, 424, 36, 21, 61, "#f9efdb");
  const [tx, ty] = project(345, 433);
  ellipse(c, tx, ty - 62, 9, 5, "#be805f");
  round(c, tx - 8, ty - 73, 16, 10, 4, "#c88c6a");
  // Small task lamp at the design desk.
  const [lx, ly] = project(197, 205);
  ellipse(c, lx, ly - 61, 14, 6, "#737e6a");
  round(c, lx - 2, ly - 105, 4, 44, 2, "#737e6a");
  ellipse(c, lx - 6, ly - 105, 18, 9, "#e6c083");
  return canvas;
}

// Six spacious seats per page. Every actual agent remains reachable in the roster.
export const seats = [
  [365, 393],
  [642, 365],
  [793, 445],
  [256, 470],
  [515, 588],
  [731, 570],
] as const;
