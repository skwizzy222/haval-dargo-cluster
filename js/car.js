window.Car = {
  ignition: true,
  engine: true,
  speed: 0,
  rpm: 0.75,
  gear: "P",
  throttle: false,
  brake: false,
  epb: true,
  seatbelt: false,
  mode: "NORMAL",
  fuel: 0.62,
  tankL: 60,
  coolant: 0.48,
  odo: 20006,
  outside: 17,
  limit: null,
  lights: { head: true, fog: false },
  signal: { left: false, right: false, hazard: false, on: false },
  laneKeep: true,
  pdc: true,
  doorsOpen: false,
  tpms: [
    { kpa: 222, c: 20 },
    { kpa: 226, c: 24 },
    { kpa: 214, c: 13 },
    { kpa: 218, c: 15 },
  ],
  climate: {
    l: 22, r: 22, fan: 2, ac: true, recirc: false,
    heatL: false, heatR: false, defrost: false, auto: true, sync: true,
  },
  audio: {
    volume: 12,
    muted: false,
    playing: true,
    source: "music",
    t: 121,
    i: 0,
    tracks: [
      { title: "Весь мир против нас", artist: "Storm DJs, Margerie", dur: 186 },
      { title: "По барам", artist: "ANNA ASTI", dur: 238 },
      { title: "Камеди Клаб Демисезон", artist: "Comedy Club", dur: 536 },
    ],
    stations: [
      { name: "Европа Плюс", freq: "106.2" },
      { name: "Радио ENERGY", freq: "104.2" },
      { name: "Авторадио", freq: "90.3" },
      { name: "Dorognoe", freq: "96.0" },
      { name: "Comedy Radio", freq: "102.5" },
    ],
    station: 0,
  },
  nav: { on: true, dest: "просп. Авиаконструкторов", dist: 4.2, eta: 12 },
  phone: { call: null },
  tripKm: 0,
  tripLiters: 0,
  tripTime: 0,
  widgets: { left: 0, right: 0, center: 0 },
};

const _ls = [];
window.onCar = (fn) => _ls.push(fn);
function bump() {
  _ls.forEach((fn) => fn(window.Car));
}

window.Car.track = function () {
  return this.audio.tracks[this.audio.i];
};

window.Car.range = function () {
  const avg = this.tripKm > 0.4 ? (this.tripLiters / this.tripKm) * 100 : 11.2;
  return Math.round((this.fuel * this.tankL * 100) / Math.max(6, avg));
};

window.Car.instant = function () {
  if (this.speed < 0.8) {
    const lph = !this.engine ? 0 : this.throttle ? 2.8 : 1.2;
    return { value: lph, unit: "L/h", l100: lph * 2 };
  }
  const load = this.throttle ? 1 : this.brake ? 0.2 : 0.4;
  const l100 = (this.mode === "ECO" ? 5.8 : this.mode === "SPORT" ? 8.2 : 6.6)
    + load * (8 + this.speed * 0.03);
  return { value: l100, unit: "L/100km", l100 };
};

window.Car.setGear = function (g) {
  if (!this.ignition) return;
  if (g !== "P" && this.epb && this.speed < 0.2) this.epb = false;
  if (g === "D" || g === "R") {
    if (this.doorsOpen) return;
    if (!this.seatbelt) { /* allow but warning stays */ }
  }
  if (this.speed > 8 && (g === "P" || g === "R" || g === "N") && g !== this.gear) {
    if (g === "P" && this.speed > 3) return;
  }
  this.gear = g;
  if (g === "P") this.epb = true;
  bump();
};

window.Car.toggle = function (key) {
  if (key === "epb") {
    if (this.speed > 2) return;
    this.epb = !this.epb;
    if (this.epb) this.gear = "P";
  } else if (key === "seatbelt") this.seatbelt = !this.seatbelt;
  else if (key === "head") this.lights.head = !this.lights.head;
  else if (key === "fog") this.lights.fog = !this.lights.fog;
  else if (key === "lane") this.laneKeep = !this.laneKeep;
  else if (key === "pdc") this.pdc = !this.pdc;
  else if (key === "door") this.doorsOpen = !this.doorsOpen;
  else if (key === "mode") {
    this.mode = this.mode === "NORMAL" ? "ECO" : this.mode === "ECO" ? "SPORT" : "NORMAL";
  } else if (key === "engine") {
    if (!this.ignition) {
      this.ignition = true;
      this.engine = true;
    } else if (this.engine) {
      this.engine = false;
      this.throttle = false;
    } else this.engine = true;
  } else if (key === "ignition") {
    this.ignition = !this.ignition;
    if (!this.ignition) {
      this.engine = false;
      this.throttle = false;
      this.speed = 0;
      this.rpm = 0;
    }
  } else if (key === "left") {
    this.signal.hazard = false;
    this.signal.left = !this.signal.left;
    this.signal.right = false;
  } else if (key === "right") {
    this.signal.hazard = false;
    this.signal.right = !this.signal.right;
    this.signal.left = false;
  } else if (key === "hazard") {
    this.signal.hazard = !this.signal.hazard;
    if (this.signal.hazard) this.signal.left = this.signal.right = true;
    else this.signal.left = this.signal.right = false;
  }
  bump();
};

window.Car.playPause = function () {
  this.audio.playing = !this.audio.playing;
  bump();
};
window.Car.nextTrack = function (dir) {
  const n = this.audio.tracks.length;
  this.audio.i = (this.audio.i + (dir || 1) + n) % n;
  this.audio.t = 0;
  this.audio.playing = true;
  this.audio.source = "music";
  bump();
};
window.Car.setStation = function (i) {
  this.audio.station = i;
  this.audio.source = "radio";
  this.audio.playing = true;
  bump();
};
window.Car.vol = function (d) {
  this.audio.volume = Math.max(0, Math.min(30, this.audio.volume + d));
  if (d > 0) this.audio.muted = false;
  bump();
};

let blinkT = 0;
window.Car.step = function (dt) {
  const c = this;
  blinkT += dt;
  if (blinkT > 0.38) {
    blinkT = 0;
    if (c.signal.left || c.signal.right || c.signal.hazard) c.signal.on = !c.signal.on;
    else c.signal.on = false;
  }

  if (!c.engine || !c.ignition) {
    c.rpm = Math.max(0, c.rpm - 4 * dt);
    c.speed = Math.max(0, c.speed - (18 + c.speed) * dt);
    c.coolant = Math.max(0.22, c.coolant - 0.01 * dt);
  } else {
    const canGo = !c.epb && !c.doorsOpen && (c.gear === "D" || c.gear === "R");
    const sign = c.gear === "R" ? -1 : 1;
    const sport = c.mode === "SPORT" ? 1.25 : c.mode === "ECO" ? 0.75 : 1;
    if (c.throttle && canGo) {
      const a = (c.speed < 70 ? 24 : c.speed < 130 ? 13 : 6) * sport;
      c.speed = Math.min(c.gear === "R" ? 40 : 240, c.speed + a * dt);
    } else if (c.brake) {
      c.speed = Math.max(0, c.speed - (28 + c.speed * 0.4) * dt);
    } else {
      c.speed = Math.max(0, c.speed - (c.gear === "N" || c.gear === "P" ? 6 : 3.2 + c.speed * 0.08) * dt);
    }
    if (!canGo && c.gear !== "N") c.speed = Math.max(0, c.speed - 20 * dt);
    const load = c.throttle && canGo ? 0.55 + c.speed / 400 : 0.08;
    const targetRpm = c.speed < 0.5 ? 0.75 + (c.throttle ? 1.4 : 0) : 0.9 + c.speed / 42 + load;
    c.rpm += (Math.min(6.5, targetRpm) - c.rpm) * Math.min(1, dt * 8);
    c.coolant = Math.min(0.92, c.coolant + (load * 0.03 + 0.008) * dt);
    if (!c.throttle) c.coolant = Math.max(0.4, c.coolant - 0.004 * dt);
  }

  const eco = c.instant();
  const kmDelta = (c.speed / 3600) * dt;
  c.odo += kmDelta;
  c.tripKm += kmDelta;
  c.tripTime += c.speed > 0.4 ? dt : 0;
  if (c.engine) {
    if (eco.unit === "L/h") c.tripLiters += (eco.value / 3600) * dt;
    else c.tripLiters += (eco.l100 / 100) * kmDelta;
    c.fuel = Math.max(0.02, c.fuel - (c.tripLiters > 0 ? (eco.unit === "L/h" ? eco.value : (eco.l100 * c.speed) / 100) / 3600 / c.tankL * dt : 0.00001 * dt));
  }

  if (c.audio.playing && c.ignition) {
    c.audio.t += dt;
    const tr = c.track();
    if (c.audio.source === "music" && c.audio.t >= tr.dur) {
      c.audio.t = 0;
      c.audio.i = (c.audio.i + 1) % c.audio.tracks.length;
    }
  }

  c.tpms.forEach((t, i) => {
    t.c += ((c.speed > 10 ? 1 : -0.2) * dt) * 0.15;
    t.c = Math.max(8, Math.min(42, t.c));
    t.kpa += (c.speed > 30 ? 0.4 : -0.1) * dt * 0.2;
  });

  if (c.nav.on && c.speed > 1) {
    c.nav.dist = Math.max(0.1, c.nav.dist - kmDelta);
    c.nav.eta = Math.max(1, Math.round((c.nav.dist / Math.max(20, c.speed)) * 60));
  }
  this._acc = (this._acc || 0) + dt;
  if (this._acc > 0.3) {
    this._acc = 0;
    bump();
  }
};

window.Car.bindKeys = function () {
  const down = (e) => {
    if (e.repeat && (e.code === "KeyW" || e.code === "KeyS" || e.code === "ArrowUp" || e.code === "ArrowDown")) return;
    const k = e.code;
    if (k === "KeyW" || k === "ArrowUp") {
      e.preventDefault();
      if (this.gear === "P" || this.epb) {
        this.epb = false;
        this.setGear("D");
      }
      this.throttle = true;
    }
    else if (k === "KeyS" || k === "ArrowDown") { e.preventDefault(); this.brake = true; }
    else if (k === "KeyA") { e.preventDefault(); this.toggle("left"); }
    else if (k === "KeyD") { e.preventDefault(); this.toggle("right"); }
    else if (k === "KeyQ") { e.preventDefault(); this.toggle("hazard"); }
    else if (k === "Space") { e.preventDefault(); this.toggle("epb"); }
    else if (k === "KeyB") this.toggle("seatbelt");
    else if (k === "KeyL") this.toggle("head");
    else if (k === "KeyF") this.toggle("fog");
    else if (k === "KeyM") this.toggle("mode");
    else if (k === "KeyI") this.toggle("engine");
    else if (k === "Digit1") this.setGear("P");
    else if (k === "Digit2") this.setGear("R");
    else if (k === "Digit3") this.setGear("N");
    else if (k === "Digit4") this.setGear("D");
    else if (k === "KeyO") this.toggle("door");
    else if (k === "Minus" || k === "NumpadSubtract") this.vol(-1);
    else if (k === "Equal" || k === "NumpadAdd") this.vol(1);
    else if (k === "KeyP") this.playPause();
    else if (k === "BracketLeft") { this.widgets.left = (this.widgets.left + 1) % 3; bump(); }
    else if (k === "BracketRight") { this.widgets.right = (this.widgets.right + 1) % 3; bump(); }
    else if (k === "Backslash") { this.widgets.center = (this.widgets.center + 1) % 3; bump(); }
  };
  const up = (e) => {
    if (e.code === "KeyW" || e.code === "ArrowUp") this.throttle = false;
    if (e.code === "KeyS" || e.code === "ArrowDown") this.brake = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", () => { this.throttle = false; this.brake = false; });
};
