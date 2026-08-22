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
  html += `<circle cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" r="3.2" fill="#f7fbff" filter="url(#softGlow)" opacity="0.35" />`;
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

function fitCockpit() {
  const el = document.getElementById("cockpit");
  if (!el) return;
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1520);
  el.style.transform = `scale(${s})`;
}

function fmtClock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function show(el, vis) {
  if (!el) return;
  el.hidden = !vis;
}

function mediaHTML() {
  const tr = Car.track();
  const t = Math.floor(Car.audio.t);
  const src = Car.audio.source === "radio" ? Car.audio.stations[Car.audio.station] : null;
  if (src) {
    return `<div class="w-media"><div class="w-eq"></div><b>FM ${src.freq}</b><span>${src.name}</span></div>`;
  }
  return `<div class="w-media"><div class="w-vinyl"></div><b>${tr.title}</b><span>${tr.artist}</span><small>${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}</small></div>`;
}

function tripHTML() {
  const mm = Math.floor(Car.tripTime / 60);
  const ss = Math.floor(Car.tripTime % 60);
  const avg = Car.tripKm > 0.3 ? Math.round(Car.tripKm / (Car.tripTime / 3600) || 0) : 0;
  return `<div class="w-trip"><div>TRIP A</div>
    <div>⏱ ${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}</div>
    <div>📍 ${Car.tripKm.toFixed(1)} km</div>
    <div>AVG ${avg || "---"} km/h</div></div>`;
}

function consMiniHTML() {
  const eco = Car.instant();
  const avg = Car.tripKm < 0.3 ? "---.-" : ((Car.tripLiters / Car.tripKm) * 100).toFixed(1);
  return `<div class="w-cons"><b>РАСХОД А</b><div>Средн. ${avg}</div><div>Мгнов. ${eco.value.toFixed(1)} ${eco.unit}</div></div>`;
}

let fuelDraw = 0;
function renderCluster() {
  const c = window.Car;
  const kmh = Math.round(c.speed);
  const speedEl = document.getElementById("speed-value");
  if (speedEl) {
    speedEl.textContent = String(kmh);
    speedEl.style.fontSize = kmh >= 100 ? "86px" : "108px";
  }

  const eco = c.instant();
  const inst = document.getElementById("inst-value");
  const unit = document.getElementById("inst-unit");
  if (inst) inst.textContent = eco.value.toFixed(1);
  if (unit) unit.textContent = eco.unit;
  const fill = document.getElementById("cons-fill");
  if (fill) fill.setAttribute("width", String(Math.max(6, Math.min(280, (eco.l100 / 30) * 280))));
  const avg = document.getElementById("avg-value");
  if (avg) {
    if (c.tripKm < 0.3) { avg.textContent = "---.-"; avg.classList.add("dim"); }
    else { avg.textContent = ((c.tripLiters / c.tripKm) * 100).toFixed(1); avg.classList.remove("dim"); }
  }

  const gear = document.getElementById("gear");
  if (gear) gear.textContent = c.gear === "D" && c.speed > 1 ? "D1" : c.gear;
  const odo = document.getElementById("odo");
  if (odo) odo.textContent = `${Math.round(c.odo)} km`;
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = fmtClock();
  const outside = document.getElementById("outside");
  if (outside) outside.textContent = `${c.outside}°C`;
  const mode = document.getElementById("mode-tag");
  if (mode) mode.textContent = c.mode;

  const epb = document.getElementById("epb");
  if (epb) epb.classList.toggle("off", !c.epb);
  const sb = document.getElementById("seatbelt");
  if (sb) sb.classList.toggle("off", c.seatbelt);
  const lane = document.getElementById("lane-icon");
  if (lane) lane.style.opacity = c.laneKeep ? "1" : "0.2";
  const adas = document.getElementById("adas");
  if (adas) adas.style.opacity = c.laneKeep || c.pdc ? "1" : "0.2";
  const door = document.getElementById("door-ico");
  if (door) door.hidden = !c.doorsOpen;
  const warn = document.getElementById("warn-tri");
  if (warn) warn.style.opacity = (!c.seatbelt || c.doorsOpen || !c.engine) ? "1" : "0";

  const sl = document.getElementById("sig-l");
  const sr = document.getElementById("sig-r");
  if (sl) sl.classList.toggle("on", (c.signal.left || c.signal.hazard) && c.signal.on);
  if (sr) sr.classList.toggle("on", (c.signal.right || c.signal.hazard) && c.signal.on);

  const lights = document.getElementById("cluster-lights");
  if (lights) {
    lights.innerHTML = `${c.lights.head ? "<span class='lg'>◉</span>" : ""}${c.lights.fog ? "<span class='lg fog'>雾</span>" : ""}`;
  }

  const lim = document.getElementById("limit-sign");
  if (lim) {
    lim.textContent = c.limit ? String(c.limit) : "";
    lim.classList.toggle("num", !!c.limit);
  }

  const tps = ["fl", "fr", "rl", "rr"];
  tps.forEach((k, i) => {
    const p = document.getElementById(`tp-${k}`);
    const t = document.getElementById(`tt-${k}`);
    if (p) p.textContent = `${Math.round(c.tpms[i].kpa)} kPa`;
    if (t) t.textContent = `${Math.round(c.tpms[i].c)}°C`;
  });

  show(document.getElementById("left-nav"), c.widgets.left === 0);
  show(document.getElementById("left-media"), c.widgets.left === 1);
  show(document.getElementById("left-cons"), c.widgets.left === 2);
  const lm = document.getElementById("left-media");
  const lc = document.getElementById("left-cons");
  if (lm && c.widgets.left === 1) lm.innerHTML = mediaHTML();
  if (lc && c.widgets.left === 2) lc.innerHTML = consMiniHTML();

  show(document.getElementById("right-tpms"), c.widgets.right === 0);
  show(document.getElementById("right-media"), c.widgets.right === 1);
  show(document.getElementById("right-trip"), c.widgets.right === 2);
  const rm = document.getElementById("right-media");
  const rt = document.getElementById("right-trip");
  if (rm && c.widgets.right === 1) rm.innerHTML = mediaHTML();
  if (rt && c.widgets.right === 2) rt.innerHTML = tripHTML();

  show(document.getElementById("center-cons"), c.widgets.center === 0);
  show(document.getElementById("center-media"), c.widgets.center === 1);
  show(document.getElementById("center-trip"), c.widgets.center === 2);
  const cm = document.getElementById("center-media");
  const ct = document.getElementById("center-trip");
  if (cm && c.widgets.center === 1) cm.innerHTML = mediaHTML();
  if (ct && c.widgets.center === 2) ct.innerHTML = tripHTML();

  const needle = document.getElementById("speed-needle");
  if (needle) {
    const d = speedDeg(Math.min(240, c.speed));
    const [nx, ny] = degToPos(d, 270);
    let html = "";
    if (c.speed > 0.4) {
      html += `<path d="${arcPath(SPEED_START, d, 258)}" fill="none" stroke="#9fd4ff" stroke-width="3.2" filter="url(#cyanGlow)" />`;
    }
    html += `<circle cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" r="4.2" fill="#f7fbff" filter="url(#softGlow)" />`;
    needle.innerHTML = html;
  }

  fuelDraw += 1;
  if (fuelDraw % 8 === 1) {
    const fuel = document.getElementById("fuel-arc");
    const cool = document.getElementById("coolant-arc");
    if (fuel) {
      const [px, py] = degToPos(90, 242);
      const [rx, ry] = degToPos(72, 236);
      fuel.innerHTML =
        drawSegmentedArc(fuel, 124, 56, 276, { filled: c.fuel, reserve: 0.14, segments: 26 }) +
        polarText(128, 262, "E") + polarText(52, 262, "F") +
        `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)})">
          <path d="M-7 8 V-6.5 A2 2 0 0 1 -5-8.5 h7 A2 2 0 0 1 4-6.5 V8" fill="none" stroke="#fff" stroke-width="1.6"/>
          <path d="M-8 8 h14" fill="none" stroke="#fff" stroke-width="1.6"/>
          <rect x="-3.2" y="-5.2" width="5.2" height="3" rx="0.4" fill="#fff"/>
        </g>` +
        `<text class="gauge-label" x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" text-anchor="start" dominant-baseline="middle">${c.range()} km</text>`;
    }
    if (cool) {
      const [tx, ty] = degToPos(90, 242);
      cool.innerHTML =
        drawSegmentedArc(cool, 124, 56, 276, { filled: c.coolant, reserve: 0, redZone: 0.12, segments: 24 }) +
        polarText(128, 262, "C") + polarText(52, 262, "H") +
        `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})" fill="none" stroke="#fff" stroke-width="1.6">
          <path d="M-2.2 1.6 V-7.2 a2.2 2.2 0 0 1 4.4 0 V1.6 a3.4 3.4 0 1 1-4.4 0z"/>
          <circle cx="0" cy="4.6" r="1.5" fill="#fff" stroke="none"/>
        </g>`;
    }
  }
}

let lastTs = 0;
function tick(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  Car.step(dt);
  renderCluster();
  requestAnimationFrame(tick);
}

window.addEventListener("resize", fitCockpit);
document.addEventListener("DOMContentLoaded", () => {
  drawSpeedTicks();
  drawFuelAndCoolant();
  drawConsTicks();
  drawMap();
  fitCockpit();
  Car.bindKeys();
  document.getElementById("gear")?.addEventListener("click", () => {
    const g = ["P", "R", "N", "D"];
    Car.setGear(g[(g.indexOf(Car.gear) + 1) % 4]);
  });
  document.getElementById("epb")?.addEventListener("click", () => Car.toggle("epb"));
  document.getElementById("seatbelt")?.addEventListener("click", () => Car.toggle("seatbelt"));
  document.querySelector(".gauge-left")?.addEventListener("click", () => {
    Car.widgets.left = (Car.widgets.left + 1) % 3;
  });
  document.querySelector(".gauge-right")?.addEventListener("click", (e) => {
    if (e.target.closest(".tire")) return;
    Car.widgets.right = (Car.widgets.right + 1) % 3;
  });
  document.querySelector(".center-stack")?.addEventListener("click", (e) => {
    if (e.target.closest(".limit-sign")) {
      Car.limit = Car.limit ? null : 50;
      return;
    }
    Car.widgets.center = (Car.widgets.center + 1) % 3;
  });
  renderCluster();
  requestAnimationFrame(tick);
});
