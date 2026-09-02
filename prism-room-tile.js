class PrismRoomTile extends HTMLElement {
  setConfig(config) {
    if (!config.room_name && !config.entity) {
      throw new Error("prism-room-tile: 'room_name' oder 'entity' erforderlich");
    }
    this._config = config;
    this._built = false;
  }

  getCardSize() { return 3; }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) {
      this._build();
      this._built = true;
    }
    this._update();
  }

  _navigate() {
    const path = this._config.navigation_path;
    if (!path) return;
    window.history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true }));
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      bubbles: true, composed: true, detail: { entityId }
    }));
  }

  _toggle(entityId) {
    if (!this._hass || !entityId) return;
    const domain = entityId.split(".")[0];
    const state = this._hass.states[entityId];
    if (!state) return;
    if (["climate", "media_player", "select", "sensor", "binary_sensor"].includes(domain)) {
      this._moreInfo(entityId);
      return;
    }
    if (domain === "cover") {
      this._hass.callService("cover", state.state === "open" ? "close_cover" : "open_cover", {}, { entity_id: entityId });
      return;
    }
    this._hass.callService(domain, "toggle", {}, { entity_id: entityId });
  }

  _build() {
    const cfg = this._config;
    const accent = cfg.accent_color || "#60a5fa";
    this.innerHTML = `
      <style>
        :host { display:block; }
        .prism-tile {
          position: relative;
          border-radius: 20px;
          padding: 16px 18px;
          background: linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);
          cursor: pointer;
          overflow: hidden;
          transition: transform .15s ease;
        }
        .prism-tile:active { transform: scale(0.98); }
        .prism-glow {
          position: absolute; top:-60px; right:-40px; width: 160px; height: 160px;
          background: radial-gradient(circle, ${accent} 0%, transparent 70%);
          opacity: .18; filter: blur(6px); pointer-events: none;
        }
        .prism-corner {
          position: absolute; top: 14px; right: 16px;
          display: flex; gap: 8px; z-index: 2;
        }
        .prism-corner-icon {
          width: 26px; height: 26px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.35);
          transition: all .15s ease;
        }
        .prism-corner-icon ha-icon { --mdc-icon-size: 15px; }
        .prism-corner-icon.active {
          color: var(--corner-color, ${accent});
          background: rgba(255,255,255,0.09);
          box-shadow: 0 0 8px var(--corner-color, ${accent});
        }
        .prism-head { display:flex; align-items:center; gap:12px; margin-bottom: 10px; position:relative; z-index:1; padding-right: 70px; }
        .prism-icon-badge {
          width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center;
          background: rgba(255,255,255,0.06);
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.3);
          color: ${accent};
          flex-shrink:0;
        }
        .prism-icon-badge ha-icon { --mdc-icon-size: 24px; }
        .prism-titles { min-width:0; }
        .prism-name { font-size:15px; font-weight:600; color: rgba(255,255,255,0.95); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .prism-status { font-size:12px; color: rgba(255,255,255,0.55); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .prism-info-row { display:flex; gap:12px; margin-bottom:10px; flex-wrap:wrap; position:relative; z-index:1; }
        .prism-info-chip { display:flex; align-items:center; gap:4px; font-size:11px; color: rgba(255,255,255,0.6); }
        .prism-info-chip ha-icon { --mdc-icon-size:14px; }
        .prism-divider { height:1px; background: rgba(255,255,255,0.09); margin: 8px 0 10px; }
        .prism-entities { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; position:relative; z-index:1; }
        .prism-entity-btn {
          display:flex; align-items:center; justify-content:center;
          width:38px; height:38px; border-radius:12px;
          background: rgba(255,255,255,0.05);
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.25);
          color: rgba(255,255,255,0.4);
          transition: all .15s ease;
        }
        .prism-entity-btn.active {
          box-shadow: inset 0 1px 4px rgba(0,0,0,0.4), 0 0 10px var(--btn-color, ${accent});
          color: var(--btn-color, ${accent});
          background: rgba(255,255,255,0.08);
        }
        .prism-entity-btn ha-icon { --mdc-icon-size:18px; }
      </style>
      <div class="prism-tile">
        <div class="prism-glow"></div>
        <div class="prism-corner"></div>
        <div class="prism-head">
          <div class="prism-icon-badge"><ha-icon icon="${cfg.icon || "mdi:home"}"></ha-icon></div>
          <div class="prism-titles">
            <div class="prism-name">${cfg.room_name || ""}</div>
            <div class="prism-status"></div>
          </div>
        </div>
        <div class="prism-info-row"></div>
        <div class="prism-divider"></div>
        <div class="prism-entities"></div>
      </div>
    `;

    const tile = this.querySelector(".prism-tile");
    tile.addEventListener("click", (e) => {
      if (e.target.closest(".prism-entity-btn") || e.target.closest(".prism-corner-icon")) return;
      this._navigate();
    });

    const cornerRow = this.querySelector(".prism-corner");
    (cfg.corner_entities || []).forEach((info) => {
      const c = document.createElement("div");
      c.className = "prism-corner-icon";
      c.dataset.entity = info.entity;
      c.style.setProperty("--corner-color", info.color || accent);
      c.innerHTML = `<ha-icon icon="${info.icon || "mdi:information"}"></ha-icon>`;
      c.addEventListener("click", (e) => {
        e.stopPropagation();
        this._moreInfo(info.entity);
      });
      cornerRow.appendChild(c);
    });

    const infoRow = this.querySelector(".prism-info-row");
    (cfg.info_entities || []).forEach((info) => {
      const chip = document.createElement("div");
      chip.className = "prism-info-chip";
      chip.dataset.entity = info.entity;
      chip.innerHTML = `<ha-icon icon="${info.icon || "mdi:information"}"></ha-icon><span></span>`;
      infoRow.appendChild(chip);
    });

    const entRow = this.querySelector(".prism-entities");
    (cfg.entities || []).forEach((ent) => {
      const btn = document.createElement("div");
      btn.className = "prism-entity-btn";
      btn.dataset.entity = ent.entity;
      btn.style.setProperty("--btn-color", ent.color || accent);
      btn.innerHTML = `<ha-icon icon="${ent.icon || "mdi:toggle-switch"}"></ha-icon>`;
      let holdTimer = null;
      btn.addEventListener("pointerdown", () => {
        holdTimer = setTimeout(() => { this._moreInfo(ent.entity); holdTimer = null; }, 500);
      });
      btn.addEventListener("pointerup", (e) => {
        e.stopPropagation();
        if (holdTimer) { clearTimeout(holdTimer); this._toggle(ent.entity); }
      });
      btn.addEventListener("pointerleave", () => { if (holdTimer) clearTimeout(holdTimer); });
      entRow.appendChild(btn);
    });
  }

  _update() {
    const hass = this._hass;
    const cfg = this._config;
    if (!hass) return;

    const statusEl = this.querySelector(".prism-status");
    let parts = [];
    if (cfg.temperature_entity && hass.states[cfg.temperature_entity]) {
      parts.push(`${parseFloat(hass.states[cfg.temperature_entity].state).toFixed(1)}°`);
    }
    if (statusEl) statusEl.textContent = parts.join(" · ");

    const badge = this.querySelector(".prism-icon-badge");
    if (badge && cfg.entity && hass.states[cfg.entity]) {
      const on = hass.states[cfg.entity].state === "on";
      badge.style.boxShadow = on
        ? `inset 0 1px 2px rgba(255,255,255,0.08), 0 0 14px ${cfg.accent_color || "#60a5fa"}`
        : "inset 0 1px 2px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.3)";
    }

    this.querySelectorAll(".prism-corner-icon").forEach((c) => {
      const entityId = c.dataset.entity;
      const state = hass.states[entityId];
      if (!state) return;
      const on = ["on", "open"].includes(state.state);
      c.classList.toggle("active", on);
    });

    this.querySelectorAll(".prism-info-chip").forEach((chip) => {
      const entityId = chip.dataset.entity;
      const state = hass.states[entityId];
      const span = chip.querySelector("span");
      if (!state) { span.textContent = "–"; return; }
      if (entityId.split(".")[0] === "binary_sensor") {
        span.textContent = state.state === "on" ? "Ja" : "Nein";
      } else {
        const unit = state.attributes.unit_of_measurement || "";
        span.textContent = `${state.state}${unit}`;
      }
    });

    this.querySelectorAll(".prism-entity-btn").forEach((btn) => {
      const entityId = btn.dataset.entity;
      const state = hass.states[entityId];
      if (!state) return;
      const on = ["on", "open", "playing", "home"].includes(state.state);
      btn.classList.toggle("active", on);
    });
  }
}

customElements.define("prism-room-tile", PrismRoomTile);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "prism-room-tile",
  name: "Prism Room Tile",
  description: "Glassmorphism Raum-Navigationskarte im Prism-Stil (Tap = Navigate, Mini-Icons togglebar)"
});
