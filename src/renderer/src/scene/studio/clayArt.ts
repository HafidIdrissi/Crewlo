/** Original Crewlo procedural artwork. MIT; no external artwork or textures.
 * All figurines use a 120 × 160 unit sculpt: 48-unit head, short limbs,
 * upper-left light, warm occlusion. Recipes vary hair, clothing and accessories.
 */
export const clayRecipes = [
  {
    skin: "#b97853",
    hair: "#302925",
    shirt: "#bc6c50",
    trousers: "#444c49",
    hairStyle: "curls",
    accessory: "pencil",
  },
  {
    skin: "#ebbc97",
    hair: "#664336",
    shirt: "#849b86",
    trousers: "#575869",
    hairStyle: "bun",
    accessory: "scarf",
  },
  {
    skin: "#cf9870",
    hair: "#242e35",
    shirt: "#7899b0",
    trousers: "#665348",
    hairStyle: "sweep",
    accessory: "glasses",
  },
  { skin: "#b98465", hair: "#34312d", shirt: "#c09a62", trousers: "#555d52", hairStyle: "bob", accessory: "apron" },
  { skin: "#e2ae88", hair: "#80513a", shirt: "#8c9a9b", trousers: "#665348", hairStyle: "cap", accessory: "headphones" },
  { skin: "#855138", hair: "#292625", shirt: "#aa8490", trousers: "#444c49", hairStyle: "puffs", accessory: "collar" },
  { skin: "#c69473", hair: "#3e3029", shirt: "#7c9376", trousers: "#514a46", hairStyle: "short", accessory: "beard" },
  { skin: "#edc4a3", hair: "#aa6745", shirt: "#7690a6", trousers: "#555a65", hairStyle: "long", accessory: "freckles" },
  { skin: "#a86c4b", hair: "#c9c3b8", shirt: "#b8795e", trousers: "#534c43", hairStyle: "bob", accessory: "glasses" },
  { skin: "#d2a17e", hair: "#302a25", shirt: "#8e9d85", trousers: "#4b5459", hairStyle: "topknot", accessory: "vest" },
  { skin: "#8b5941", hair: "#28282b", shirt: "#b59869", trousers: "#514b55", hairStyle: "braids", accessory: "earrings" },
  { skin: "#e4b28e", hair: "#765341", shirt: "#9b859b", trousers: "#535a51", hairStyle: "beanie", accessory: "scarf" },
  { skin: "#ba825d", hair: "#2d302b", shirt: "#7295a4", trousers: "#5b5145", hairStyle: "shaved", accessory: "headphones" },
  { skin: "#d9aa86", hair: "#b8b0a1", shirt: "#b9866d", trousers: "#485753", hairStyle: "sweep", accessory: "beard" },
  { skin: "#946244", hair: "#342a24", shirt: "#91a28e", trousers: "#5c5262", hairStyle: "waves", accessory: "apron" },
] as const;

export function recipeIndex(key: string): number {
  const legacy = [
    "michael",
    "jim",
    "pam",
    "dwight",
    "kevin",
    "angela",
    "oscar",
    "stanley",
    "phyllis",
    "andy",
    "kelly",
    "ryan",
    "toby",
    "creed",
    "meredith",
  ];
  const index = legacy.indexOf(key);
  return index < 0
    ? Array.from(key).reduce((sum, c) => sum + c.charCodeAt(0), 0)
    : index;
}

export function ellipse(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
export function round(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
}
function material(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  const g = c.createRadialGradient(
    x - radius * 0.4,
    y - radius * 0.5,
    2,
    x,
    y,
    radius * 1.4,
  );
  g.addColorStop(0, color);
  g.addColorStop(0.55, color);
  g.addColorStop(1, "#49392c");
  return g;
}
export function drawFigurine(
  c: CanvasRenderingContext2D,
  key: string,
  pose: "neutral" | "working" | "attention" = "neutral",
  phase = 0,
) {
  const index = recipeIndex(key),
    p = clayRecipes[index % clayRecipes.length];
  const shirt = p.shirt;
  ellipse(c, 61, 149, 34, 7, "#59443220");
  round(c, 39, 115, 18, 30, 9, p.trousers);
  round(c, 65, 115, 18, 30, 9, p.trousers);
  round(c, 35, 136, 25, 12, 6, "#e7dcc9");
  round(c, 64, 136, 25, 12, 6, "#e7dcc9");
  round(c, 33, 76, 55, 48, 21, material(c, 50, 83, 55, shirt));
  // Rolled sleeves and hands. Only real working states use the typing pose.
  const working = pose === "working",
    raised = pose === "attention";
  c.save();
  c.translate(36, 86);
  c.rotate(working ? -0.7 : 0.12);
  round(c, -10, 0, 17, 33, 8, shirt);
  ellipse(c, -2, 30 + (working ? phase : 0), 8, 9, p.skin);
  c.restore();
  c.save();
  c.translate(83, 87);
  c.rotate(raised ? -2.7 : working ? 0.7 : -0.12);
  round(c, -7, 0, 17, raised ? 39 : 31, 8, shirt);
  ellipse(c, 2, (raised ? 39 : 30) - (working ? phase : 0), 8, 9, p.skin);
  c.restore();
  round(c, 51, 65, 19, 20, 8, p.skin);
  // Back volumes establish silhouettes before the face, with the same clay light.
  if (["bob", "long", "waves", "braids"].includes(p.hairStyle)) {
    round(c, 27, 13, 66, p.hairStyle === "bob" ? 59 : 81, 28, material(c, 48, 24, 48, p.hair));
  }
  if (p.hairStyle === "puffs") {
    ellipse(c, 28, 27, 17, 19, p.hair); ellipse(c, 91, 27, 17, 19, p.hair);
  }
  if (p.hairStyle === "braids") {
    for (let i = 0; i < 5; i++) { ellipse(c, 30, 49 + i * 10, 7, 8, p.hair); ellipse(c, 90, 49 + i * 10, 7, 8, p.hair); }
  }
  if (p.hairStyle === "topknot") ellipse(c, 60, 11, 12, 11, p.hair);
  if (p.hairStyle === "bun") {
    ellipse(c, 60, 43, 31, 34, p.hair);
    ellipse(c, 79, 15, 16, 15, p.hair);
  }
  ellipse(c, 33, 48, 7, 10, p.skin);
  ellipse(c, 88, 48, 7, 10, p.skin);
  c.beginPath();
  c.ellipse(60, 44, 29, 33, 0, 0, Math.PI * 2);
  c.fillStyle = material(c, 55, 36, 37, p.skin);
  c.fill();
  if (p.hairStyle === "curls") {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i * Math.PI) / 8;
      ellipse(c, 60 + Math.cos(a) * 26, 33 + Math.sin(a) * 19, 10, 11, p.hair);
    }
    ellipse(c, 47, 18, 12, 9, "#40332b");
  } else if (p.hairStyle !== "shaved") {
    c.beginPath();
    c.moveTo(31, 38);
    c.bezierCurveTo(21, -2, 91, -5, 90, 39);
    c.bezierCurveTo(73, 32, 73, 19, 66, 19);
    c.bezierCurveTo(53, 33, 40, 24, 31, 38);
    c.fillStyle = p.hair;
    c.fill();
    c.beginPath();
    c.moveTo(40, 17);
    c.quadraticCurveTo(58, 5, 75, 17);
    c.strokeStyle = "#ffffff18";
    c.lineWidth = 3;
    c.stroke();
  }
  if (p.hairStyle === "bob") round(c, 31, 15, 58, 17, 7, p.hair);
  if (p.hairStyle === "short") {
    round(c, 34, 15, 52, 13, 6, p.hair);
    round(c, 29, 28, 6, 22, 3, p.hair); round(c, 85, 28, 6, 22, 3, p.hair);
  }
  if (p.hairStyle === "cap" || p.hairStyle === "beanie") {
    round(c, 29, 6, 62, 28, 16, material(c, 48, 10, 40, p.hairStyle === "cap" ? "#647b69" : "#b87c59"));
    round(c, p.hairStyle === "cap" ? 23 : 29, 27, p.hairStyle === "cap" ? 77 : 62, 9, 4, p.hairStyle === "cap" ? "#546e5e" : "#9c6448");
    if (p.hairStyle === "beanie") ellipse(c, 60, 4, 9, 7, "#b87c59");
  }
  if (p.hairStyle === "waves") {
    for (let i = 0; i < 5; i++) ellipse(c, 37 + i * 11, 21 + (i % 2) * 5, 12, 12, p.hair);
  }
  if (p.accessory === "beard") {
    c.beginPath(); c.moveTo(35, 50); c.quadraticCurveTo(60, 85, 85, 50);
    c.quadraticCurveTo(83, 81, 60, 78); c.quadraticCurveTo(37, 79, 35, 50); c.fillStyle = p.hair; c.fill();
  }
  if (p.accessory === "freckles") {
    for (const x of [38, 43, 47, 74, 79, 83]) ellipse(c, x, 53 + (x % 3), 1, 1, "#9c6041");
  }
  if (p.accessory === "earrings") {
    ellipse(c, 31, 59, 4, 6, "#d5b876"); ellipse(c, 90, 59, 4, 6, "#d5b876");
  }
  if (p.accessory === "headphones") {
    c.beginPath(); c.arc(60, 39, 34, Math.PI, 0); c.strokeStyle = "#d8cbb3"; c.lineWidth = 6; c.stroke();
    round(c, 22, 34, 12, 24, 6, "#637782"); round(c, 86, 34, 12, 24, 6, "#637782");
  }
  if (p.accessory === "apron") {
    round(c, 41, 85, 38, 38, 7, "#dfc9a5"); round(c, 46, 102, 26, 12, 3, "#c1a882");
    round(c, 44, 76, 5, 21, 2, "#dfc9a5"); round(c, 73, 76, 5, 21, 2, "#dfc9a5");
  }
  if (p.accessory === "vest") {
    round(c, 34, 79, 21, 43, 8, "#dbceb8"); round(c, 65, 79, 21, 43, 8, "#dbceb8");
  }
  if (p.accessory === "collar") {
    round(c, 45, 78, 14, 10, 3, "#f0e6d4"); round(c, 62, 78, 14, 10, 3, "#f0e6d4");
    for (const y of [94, 106, 117]) ellipse(c, 60, y, 1.5, 1.5, "#e7d8bd");
  }
  ellipse(c, 48, 44, 2.7, working ? 2 : 3.3, "#332e2a");
  ellipse(c, 72, 44, 2.7, working ? 2 : 3.3, "#332e2a");
  ellipse(c, 59, 52, 5, 4, "#ffffff20");
  ellipse(c, 40, 55, 5, 3, "#c16e622c");
  ellipse(c, 80, 55, 5, 3, "#c16e622c");
  c.beginPath();
  c.moveTo(53, 61);
  c.quadraticCurveTo(60, raised ? 58 : 66, 67, 61);
  c.strokeStyle = "#724c3b";
  c.lineWidth = 2;
  c.lineCap = "round";
  c.stroke();
  if (p.accessory === "glasses") {
    c.strokeStyle = "#3e4546";
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(38, 36, 20, 17, 6);
    c.roundRect(63, 36, 20, 17, 6);
    c.moveTo(58, 42);
    c.lineTo(63, 42);
    c.stroke();
  }
  if (p.accessory === "scarf") {
    round(c, 45, 77, 33, 9, 4, "#e6d5b5");
    round(c, 67, 80, 8, 19, 3, "#e6d5b5");
  }
  if (p.accessory === "pencil") {
    round(c, 66, 92, 12, 15, 3, "#a75c44");
    round(c, 69, 86, 3, 14, 1, "#e8c476");
  }
}

export function figurineCanvas(
  key: string,
  pose: "neutral" | "working" | "attention" = "neutral",
  phase = 0,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 320;
  const c = canvas.getContext("2d")!;
  c.scale(2, 2);
  drawFigurine(c, key, pose, phase);
  return canvas;
}
