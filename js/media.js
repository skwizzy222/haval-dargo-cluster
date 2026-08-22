(function () {
  const $ = (sel) => document.querySelector(sel);
  let page = "home";
  let volT;

  const contacts = [
    { name: "Мама", tel: "+7 921 000-11-22" },
    { name: "СТО Haval", tel: "+7 812 555-20-22" },
    { name: "Анна", tel: "+7 911 234-56-78" },
    { name: "Такси", tel: "222-22" },
  ];

  function fmt(t) {
    t = Math.max(0, Math.floor(t));
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  }

  function dock(active) {
    return `
      <nav class="hu-dock">
        <button class="dock-btn ${active === "home" ? "active" : ""}" data-go="home">ДОМ</button>
        <button class="dock-btn ${active === "nav" ? "active" : ""}" data-go="nav">НАВИ</button>
        <button class="dock-btn ${active === "music" ? "active" : ""}" data-go="music">МЕДИА</button>
        <button class="dock-btn ${active === "climate" ? "active" : ""}" data-go="climate">КЛИМАТ<br>${Car.climate.l}°</button>
        <button class="dock-btn ${active === "car" ? "active" : ""}" data-go="car">АВТО</button>
        <button class="dock-btn" data-act="vol-">−</button>
        <button class="dock-btn" data-act="vol+">🔊 ${Car.audio.muted ? "MUTE" : Car.audio.volume}</button>
      </nav>`;
  }

  function bar() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `<div class="hu-bar">
      <span>${hh}:${mm}</span>
      <span class="mid">${Car.lights.head ? "AUTO свет" : "Свет выкл"} · BT · ${Car.audio.source === "radio" ? Car.audio.stations[Car.audio.station].freq : "USB"}</span>
      <span class="temp">${Car.outside}°C</span>
    </div>`;
  }

  const screens = {
    home() {
      const apps = [
        ["nav", "🗺️", "НАВИГАЦИЯ"],
        ["radio", "📻", "РАДИО"],
        ["music", "🎵", "МУЗЫКА"],
        ["phone", "📞", "ТЕЛЕФОН"],
        ["climate", "❄️", "КЛИМАТ"],
        ["camera", "📷", "КАМЕРА 360"],
        ["car", "🚙", "АВТОМОБИЛЬ"],
        ["settings", "⚙️", "НАСТРОЙКИ"],
      ];
      return `<div class="apps">${apps.map(([id, ico, n]) =>
        `<button class="app" data-go="${id}"><span class="ico">${ico}</span>${n}</button>`
      ).join("")}</div>`;
    },
    music() {
      const tr = Car.track();
      const pct = Math.min(100, (Car.audio.t / tr.dur) * 100);
      return `<div class="row"><button class="back" data-go="home">←</button><div class="screen-title">МУЗЫКА</div></div>
        <div class="now">
          <div class="vinyl"><i></i></div>
          <div>
            <h2>${tr.title}</h2>
            <div class="art">${tr.artist}</div>
            <div class="prog"><span style="width:${pct}%"></span></div>
            <div class="times"><span>${fmt(Car.audio.t)}</span><span>${fmt(tr.dur)}</span></div>
            <div class="media-btns">
              <button data-act="prev">⏮</button>
              <button class="play" data-act="pp">${Car.audio.playing ? "⏸" : "▶"}</button>
              <button data-act="next">⏭</button>
              <button data-act="src-radio">РАДИО</button>
            </div>
          </div>
        </div>`;
    },
    radio() {
      return `<div class="row"><button class="back" data-go="home">←</button><div class="screen-title">FM РАДИО</div></div>
        <div class="stations">${Car.audio.stations.map((s, i) =>
          `<button class="stn ${i === Car.audio.station && Car.audio.source === "radio" ? "active" : ""}" data-act="stn" data-i="${i}">
            ${s.freq}<br>${s.name}
          </button>`
        ).join("")}</div>`;
    },
    climate() {
      const z = Car.climate;
      const on = (k) => (z[k] ? "on" : "");
      return `<div class="row"><button class="back" data-go="home">←</button><div class="screen-title">КЛИМАТ</div></div>
        <div class="clim">
          <div class="zone">
            <div>ВОДИТЕЛЬ</div>
            <div class="deg">${z.l}°</div>
            <div><button data-act="cl" data-k="l" data-d="-1">−</button><button data-act="cl" data-k="l" data-d="1">+</button></div>
            <button class="${on("heatL")}" data-act="ct" data-k="heatL">ПОДОГРЕВ</button>
          </div>
          <div class="clim-mid">
            <button class="${on("auto")}" data-act="ct" data-k="auto">AUTO</button>
            <button class="${on("ac")}" data-act="ct" data-k="ac">A/C</button>
            <button class="${on("recirc")}" data-act="ct" data-k="recirc">ЦИРК.</button>
            <button class="${on("defrost")}" data-act="ct" data-k="defrost">СТЁКЛА</button>
            <button class="${on("sync")}" data-act="ct" data-k="sync">SYNC</button>
            <div class="row" style="justify-content:center">
              <button data-act="fan" data-d="-1">вентилятор −</button>
              <b>${z.fan}</b>
              <button data-act="fan" data-d="1">+</button>
            </div>
          </div>
          <div class="zone">
            <div>ПАССАЖИР</div>
            <div class="deg">${z.r}°</div>
            <div><button data-act="cl" data-k="r" data-d="-1">−</button><button data-act="cl" data-k="r" data-d="1">+</button></div>
            <button class="${on("heatR")}" data-act="ct" data-k="heatR">ПОДОГРЕВ</button>
          </div>
        </div>`;
    },
    nav() {
      return `<div class="row"><button class="back" data-go="home">←</button><div class="screen-title">НАВИГАЦИЯ</div>
        <button class="pill" data-act="nav-toggle">${Car.nav.on ? "СБРОС МАРШРУТА" : "ПОЕХАТЬ"}</button></div>
        <div class="nav-big" id="hu-map"></div>
        <div class="nav-overlay">
          <div>${Car.nav.dest}</div>
          <b>${Car.nav.dist.toFixed(1)} км</b>
          <div>ETA ${Car.nav.eta} мин</div>
        </div>`;
    },
    camera() {
      return `<div class="row"><button class="back" data-go="home">←</button><div class="screen-title">КАМЕРА 360</div></div>
        <div class="cam"><div class="car"></div><div class="pdc-arc"></div></div>`;
    },
    phone() {
      if (Car.phone.call) {
        return `<div class="row"><button class="back" data-go="home">←</button><div class="screen-title">ТЕЛЕФОН</div></div>
          <div class="call-card">
            <div>ВЫЗОВ</div>
            <h2>${Car.phone.call.name}</h2>
            <div>${Car.phone.call.tel}</div>
            <button data-act="hang">СБРОСИТЬ</button>
          </div>`;
      }
      return `<div class="row"><button class="back" data-go="home">←</button><div class="screen-title">ТЕЛЕФОН</div></div>
        <div class="phone-list">${contacts.map((c, i) =>
          `<button class="contact" data-act="call" data-i="${i}"><span>${c.name}</span><span>${c.tel}</span></button>`
        ).join("")}</div>`;
    },
    car() {
      return `<div class="row"><button class="back" data-go="home">←</button><div class="screen-title">АВТОМОБИЛЬ</div></div>
        <button class="set-row" data-act="tg" data-k="head"><span>Ближний свет</span><span class="val">${Car.lights.head ? "ВКЛ" : "ВЫКЛ"}</span></button>
        <button class="set-row" data-act="tg" data-k="fog"><span>ПТФ</span><span class="val">${Car.lights.fog ? "ВКЛ" : "ВЫКЛ"}</span></button>
        <button class="set-row" data-act="tg" data-k="lane"><span>Удержание полосы</span><span class="val">${Car.laneKeep ? "ВКЛ" : "ВЫКЛ"}</span></button>
        <button class="set-row" data-act="tg" data-k="pdc"><span>Парктроник</span><span class="val">${Car.pdc ? "ВКЛ" : "ВЫКЛ"}</span></button>
        <button class="set-row" data-act="tg" data-k="mode"><span>Режим</span><span class="val">${Car.mode}</span></button>
        <button class="set-row" data-act="tg" data-k="epb"><span>Электроручник</span><span class="val">${Car.epb ? "ВКЛ" : "ВЫКЛ"}</span></button>
        <button class="set-row" data-act="reset-trip"><span>Сброс расход А</span><span class="val">${Car.tripKm.toFixed(1)} км</span></button>`;
    },
    settings() {
      return `<div class="row"><button class="back" data-go="home">←</button><div class="screen-title">НАСТРОЙКИ</div></div>
        <button class="set-row" data-act="limit"><span>Ограничение скорости</span><span class="val">${Car.limit || "ВЫКЛ"}</span></button>
        <button class="set-row" data-act="tg" data-k="seatbelt"><span>Ремень (симуляция)</span><span class="val">${Car.seatbelt ? "ПРИСТЁГНУТ" : "НЕТ"}</span></button>
        <button class="set-row" data-act="tg" data-k="door"><span>Дверь</span><span class="val">${Car.doorsOpen ? "ОТКРЫТА" : "ЗАКРЫТА"}</span></button>
        <button class="set-row" data-act="tg" data-k="engine"><span>Двигатель</span><span class="val">${Car.engine ? "ЗАПУЩЕН" : "ЗАГЛУШЕН"}</span></button>`;
    },
  };

  function paintMap() {
    const host = document.getElementById("hu-map");
    const src = document.getElementById("nav-map");
    if (host && src) host.innerHTML = src.outerHTML;
  }

  function render() {
    const root = document.getElementById("headunit");
    if (!root) return;
    const fn = screens[page] || screens.home;
    root.innerHTML = bar() + `<div class="hu-stage">${fn()}</div>` + dock(page) +
      `<div class="vol-toast" id="vol-toast">громкость ${Car.audio.volume}</div>`;
    if (page === "nav") paintMap();
  }

  function go(p) {
    page = p;
    render();
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go],[data-act]");
    if (!b) return;
    if (b.dataset.go) return go(b.dataset.go);
    const a = b.dataset.act;
    if (a === "pp") Car.playPause();
    else if (a === "next") Car.nextTrack(1);
    else if (a === "prev") Car.nextTrack(-1);
    else if (a === "src-radio") go("radio");
    else if (a === "vol+") { Car.vol(1); toast(); }
    else if (a === "vol-") { Car.vol(-1); toast(); }
    else if (a === "stn") Car.setStation(+b.dataset.i);
    else if (a === "cl") {
      const k = b.dataset.k;
      Car.climate[k] = Math.min(32, Math.max(16, Car.climate[k] + +b.dataset.d));
      if (Car.climate.sync && k === "l") Car.climate.r = Car.climate.l;
    }
    else if (a === "ct") Car.climate[b.dataset.k] = !Car.climate[b.dataset.k];
    else if (a === "fan") Car.climate.fan = Math.min(8, Math.max(0, Car.climate.fan + +b.dataset.d));
    else if (a === "tg") Car.toggle(b.dataset.k);
    else if (a === "call") Car.phone.call = contacts[+b.dataset.i];
    else if (a === "hang") Car.phone.call = null;
    else if (a === "nav-toggle") {
      Car.nav.on = !Car.nav.on;
      if (Car.nav.on) { Car.nav.dist = 4.2; Car.nav.eta = 12; }
    }
    else if (a === "reset-trip") { Car.tripKm = 0; Car.tripLiters = 0; Car.tripTime = 0; }
    else if (a === "limit") Car.limit = Car.limit ? null : 50;
    render();
  });

  function toast() {
    const el = document.getElementById("vol-toast");
    if (!el) return;
    el.classList.add("show");
    clearTimeout(volT);
    volT = setTimeout(() => el.classList.remove("show"), 900);
  }

  window.renderHeadunit = render;
  window.huGo = go;

  let last = "";
  onCar(() => {
    const snap = page + Car.audio.playing + Car.audio.i + Car.audio.station + Car.audio.volume +
      Car.climate.l + Car.climate.r + Car.climate.fan + Car.gear + Car.mode + (Car.phone.call && Car.phone.call.name);
    if (snap !== last) {
      last = snap;
      render();
    } else if (page === "music" || page === "nav") {
      const prog = document.querySelector(".prog > span");
      if (prog && page === "music") {
        const tr = Car.track();
        prog.style.width = `${Math.min(100, (Car.audio.t / tr.dur) * 100)}%`;
        const times = document.querySelectorAll(".times span");
        if (times[0]) times[0].textContent = fmt(Car.audio.t);
      }
      const ov = document.querySelector(".nav-overlay b");
      if (ov) ov.textContent = `${Car.nav.dist.toFixed(1)} км`;
    }
  });

  document.addEventListener("DOMContentLoaded", render);
})();
