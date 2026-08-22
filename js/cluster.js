const SPEED_START = 135;
const SPEED_SWEEP = 270;
const CX = 300;
const CY = 300;

function degToPos(deg, r, cx = CX, cy = CY) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function speedDeg(kmh) {
  return SPEED_START + (kmh / 240) * SPEED_SWEEP;
}

function polarLine(deg, r0, r1, attrs = "") {
  const [x1, y1] = degToPos(deg, r0);
  const [x2, y2] = degToPos(deg, r1);
  return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" ${attrs} />`;
}

function drawSpeedTicks() {
  const g = document.getElementById("speed-ticks");
  if (!g) return;
  let html = "";
  for (let kmh = 0; kmh <= 240; kmh += 2) {
    const d = speedDeg(kmh);
    if (kmh % 20 === 0) {
      html += polarLine(d, 276, 262, `stroke="#f3f5f7" stroke-width="2.1" stroke-linecap="round"`);
      const [tx, ty] = degToPos(d, 248);
      html += `<text class="speed-num" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${kmh}</text>`;
    } else if (kmh % 10 === 0) {
      html += polarLine(d, 276, 267, `stroke="#d8dde3" stroke-width="1.4" stroke-linecap="round"`);
    } else {
      html += polarLine(d, 276, 271, `stroke="#9aa3ad" stroke-width="1" opacity="0.85"`);
    }
  }
  const n0 = speedDeg(0);
  const [nx, ny] = degToPos(n0, 270);
  html += `<circle cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" r="3.2" fill="#f7fbff" filter="url(#softGlow)" />`;
  g.innerHTML = html;
}

function arcPath(startDeg, endDeg, r, clockwise = true, cx = CX, cy = CY) {
  const delta = clockwise
    ? (endDeg - startDeg + 360) % 360
    : (startDeg - endDeg + 360) % 360;
  const large = delta > 180 ? 1 : 0;
  const sweep = clockwise ? 1 : 0;
  const [x1, y1] = degToPos(startDeg, r, cx, cy);
  const [x2, y2] = degToPos(endDeg, r, cx, cy);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function drawSegmentedArc(el, fromDeg, toDeg, r, { filled = 0.55, reserve = 0.12, redZone = 0, segments = 26 } = {}) {
  if (!el) return "";
  let html = "";
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const a0 = fromDeg + (toDeg - fromDeg) * t0 + Math.sign(toDeg - fromDeg) * 0.45;
    const a1 = fromDeg + (toDeg - fromDeg) * t1 - Math.sign(toDeg - fromDeg) * 0.45;
    const t = (i + 0.5) / segments;
    let color = "#3f454c";
    if (t <= filled) {
      if (t < reserve) color = "#e8892a";
      else if (redZone && t > 1 - redZone) color = "#e31b23";
      else color = "#eef2f6";
    } else if (redZone && t > 1 - redZone) {
      color = "#7a2222";
    }
    html += `<path d="${arcPath(a0, a1, r, toDeg > fromDeg)}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="butt" />`;
  }
  return html;
}

function polarText(deg, r, text) {
  const [x, y] = degToPos(deg, r);
  return `<text class="gauge-label" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${text}</text>`;
}

function drawFuelAndCoolant() {
  const fuel = document.getElementById("fuel-arc");
  const cool = document.getElementById("coolant-arc");
  const [px, py] = degToPos(90, 242);
  const [rx, ry] = degToPos(72, 236);
  const [tx, ty] = degToPos(90, 242);

  if (fuel) {
    fuel.innerHTML =
      drawSegmentedArc(fuel, 124, 56, 276, { filled: 0.64, reserve: 0.14, segments: 26 }) +
      polarText(128, 262, "E") +
      polarText(52, 262, "F") +
      `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)})">
        <path d="M-7 8 V-6.5 A2 2 0 0 1 -5-8.5 h7 A2 2 0 0 1 4-6.5 V8" fill="none" stroke="#fff" stroke-width="1.6"/>
        <path d="M-8 8 h14" fill="none" stroke="#fff" stroke-width="1.6"/>
        <path d="M4 -3 h3 l3 3 v5 a2.4 2.4 0 0 1-2.4 2.4" fill="none" stroke="#fff" stroke-width="1.5"/>
        <rect x="-3.2" y="-5.2" width="5.2" height="3" rx="0.4" fill="#fff"/>
      </g>` +
      `<text class="gauge-label" x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" text-anchor="start" dominant-baseline="middle">331 km</text>`;
  }

  if (cool) {
    cool.innerHTML =
      drawSegmentedArc(cool, 124, 56, 276, { filled: 0.5, reserve: 0, redZone: 0.12, segments: 24 }) +
      polarText(128, 262, "C") +
      polarText(52, 262, "H") +
      `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round">
        <path d="M-2.2 1.6 V-7.2 a2.2 2.2 0 0 1 4.4 0 V1.6 a3.4 3.4 0 1 1-4.4 0z"/>
        <path d="M0 1.2 V-4.4" stroke-width="1.5"/>
        <circle cx="0" cy="4.6" r="1.5" fill="#fff" stroke="none"/>
        <path d="M-8 8.6 h16" stroke-width="1.5" stroke-linecap="round"/>
      </g>`;
  }
}

function drawConsTicks() {
  const g = document.getElementById("cons-ticks");
  if (!g) return;
  let html = "";
  for (let i = 0; i <= 30; i += 5) {
    const x = (i / 30) * 280;
    const h = i % 10 === 0 ? 8 : 5;
    html += `<line x1="${x}" y1="${12 - h}" x2="${x}" y2="12" stroke="#6a7078" stroke-width="1" />`;
  }
  g.innerHTML = html;
}

function drawMap() {
  const svg = document.getElementById("nav-map");
  if (!svg) return;

  svg.innerHTML = `
    <defs>
      <linearGradient id="route" x1="0" y1="1" x2="0.2" y2="0">
        <stop offset="0%" stop-color="#3dc25a" />
        <stop offset="38%" stop-color="#8be15a" />
        <stop offset="62%" stop-color="#f0d34a" />
        <stop offset="100%" stop-color="#ffcc22" />
      </linearGradient>
      <filter id="routeGlow">
        <feGaussianBlur stdDeviation="1.6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <clipPath id="round">
        <circle cx="200" cy="200" r="200" />
      </clipPath>
    </defs>
    <g clip-path="url(#round)">
      <rect width="400" height="400" fill="#12171d" />
      <!-- parks -->
      <path d="M-10 40 C40 10 90 30 110 80 C140 20 210 10 240 70 C280 20 360 40 410 10 L410 -10 L-10 -10 Z" fill="#1d4a2c" />
      <ellipse cx="78" cy="96" rx="62" ry="44" fill="#245833" />
      <ellipse cx="70" cy="92" rx="28" ry="18" fill="#2e6a3c" opacity="0.7" />
      <path d="M-20 250 C40 210 80 260 40 320 C10 360 -20 340 -20 300 Z" fill="#1b4630" />
      <ellipse cx="310" cy="70" rx="70" ry="36" fill="#214e32" />
      <path d="M250 300 C300 270 380 280 430 250 L430 430 L240 430 Z" fill="#193e2a" />
      <!-- water -->
      <path d="M300 250 C340 230 390 250 430 240 L430 310 C380 300 330 320 300 300 Z" fill="#1a3d55" />
      <!-- building blocks -->
      ${cityBlocks()}
      <!-- roads -->
      <g fill="none" stroke="#4a515a" stroke-linecap="round">
        <path stroke-width="16" d="M-20 180 H420" />
        <path stroke-width="14" d="M-10 268 H430" />
        <path stroke-width="13" d="M80 -20 V430" />
        <path stroke-width="11" d="M168 -10 V250" />
        <path stroke-width="12" d="M248 40 V430" />
        <path stroke-width="10" d="M330 -20 V220" />
        <path stroke-width="11" d="M-20 112 H260" />
        <path stroke-width="9" d="M150 330 H430" />
        <path stroke-width="10" d="M40 40 C80 90 70 140 80 180" />
        <path stroke-width="18" d="M-30 210 C60 190 140 200 200 168 C250 140 280 90 310 40 C330 8 360 -10 420 0" />
      </g>
      <g fill="none" stroke="#2c3238" stroke-width="1.2">
        <path d="M-20 180 H420" />
        <path d="M80 -20 V430" />
        <path d="M248 40 V430" />
      </g>
      <!-- route -->
      <path d="M30 360
        C50 300 70 250 92 210
        C110 178 150 168 198 150
        C240 132 268 96 292 58
        C308 32 338 18 372 22"
        fill="none" stroke="url(#route)" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#routeGlow)" />
      <!-- labels -->
      <text x="92" y="172" fill="#e8eaed" font-size="9" font-family="Jura, sans-serif" font-weight="500" letter-spacing="0.6">просп. Авиаконструкторов</text>
      <text x="256" y="318" fill="#c5c9ce" font-size="8" font-family="Jura, sans-serif">ул. Ильюшина</text>
      <!-- arrow at car position -->
      <g transform="translate(198 150) rotate(-28)">
        <polygon points="0,-16 12,12 0,6 -12,12" fill="#ffcc22" stroke="#c48a00" stroke-width="1" />
      </g>
    </g>
  `;
}

function cityBlocks() {
  const blocks = [
    [20, 130, 48, 36],
    [22, 198, 46, 40],
    [28, 290, 40, 48],
    [96, 122, 54, 42],
    [100, 198, 52, 50],
    [108, 290, 58, 44],
    [184, 50, 48, 48],
    [186, 128, 46, 36],
    [188, 198, 44, 52],
    [264, 128, 50, 40],
    [268, 198, 48, 56],
    [270, 348, 70, 40],
    [348, 118, 40, 44],
    [350, 188, 42, 36],
  ];
  return blocks
    .map(([x, y, w, h], i) => {
      const fill = i % 3 === 0 ? "#243040" : i % 3 === 1 ? "#1c2a38" : "#283646";
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="#151b22" stroke-width="1" />`;
    })
    .join("");
}

function fitCluster() {
  const cluster = document.getElementById("cluster");
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const s = Math.min(vw / 1920, vh / 720);
  cluster.style.transform = `scale(${s})`;
}

window.addEventListener("resize", fitCluster);
document.addEventListener("DOMContentLoaded", () => {
  drawSpeedTicks();
  drawFuelAndCoolant();
  drawConsTicks();
  drawMap();
  fitCluster();
});
