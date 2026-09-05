class PrismRoomTile extends HTMLElement {
  setConfig(config) {
    if (!config.room_name && !config.entity) {
      throw new Error("prism-room-tile: 'room_name' oder 'entity' erforderlich");
    }
    this._config = config;
    this._built = false;
  }

  getCardSize() { return 3; }

  static getConfigElement() {
    return document.createElement("prism-room-tile-editor");
  }

  static getStubConfig() {
    return {
      room_name: "Neuer Raum",
      icon: "mdi:home",
      accent_color: "#60a5fa",
      navigation_path: "",
      corner_entities: [],
      info_entities: [],
      entities: []
    };
  }

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
        .prism-tile.pressed { transform: scale(0.98); }
        .prism-entity-btn:active, .prism-corner-icon:active { transform: scale(0.88); }
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
        .prism-info-chip ha-icon { --mdc-icon-size:14px; color: var(--chip-color, rgba(255,255,255,0.6)); }
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

    // Manual press-state instead of CSS :active on the tile: :active bubbles
    // up from child buttons automatically, which made the whole card "press"
    // whenever a small icon button underneath was tapped. We only add the
    // pressed look when the press actually started on the tile background.
    const isChildControl = (target) => !!(target.closest(".prism-entity-btn") || target.closest(".prism-corner-icon"));

    tile.addEventListener("pointerdown", (e) => {
      if (isChildControl(e.target)) return;
      tile.classList.add("pressed");
    });
    tile.addEventListener("pointerup", () => tile.classList.remove("pressed"));
    tile.addEventListener("pointerleave", () => tile.classList.remove("pressed"));

    tile.addEventListener("click", (e) => {
      if (isChildControl(e.target)) return;
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
      if (info.color) chip.style.setProperty("--chip-color", info.color);
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
      this._bindEntityButtonActions(btn, ent);
      entRow.appendChild(btn);
    });
  }

  // --- Action handling for the quick-toggle entity row ------------------
  // Supports full tap / hold / double-tap actions, same action types as
  // native HA cards: toggle, more-info, navigate, url, call-service /
  // perform-action, none.

  _defaultTapAction(entityId) {
    const domain = (entityId || "").split(".")[0];
    if (["climate", "media_player", "select", "sensor", "binary_sensor"].includes(domain)) {
      return { action: "more-info" };
    }
    return { action: "toggle" };
  }

  _bindEntityButtonActions(btn, ent) {
    const entityId = ent.entity;
    const tapAction = ent.tap_action || this._defaultTapAction(entityId);
    const holdAction = ent.hold_action || { action: "more-info" };
    const doubleTapAction = ent.double_tap_action || { action: "none" };
    const hasDouble = doubleTapAction && doubleTapAction.action && doubleTapAction.action !== "none";

    let holdTimer = null;
    let holdTriggered = false;
    let tapTimer = null;
    let lastTapAt = 0;

    btn.addEventListener("pointerdown", () => {
      holdTriggered = false;
      holdTimer = setTimeout(() => {
        holdTriggered = true;
        this._handleAction(holdAction, entityId);
      }, 500);
    });

    btn.addEventListener("pointerup", (e) => {
      e.stopPropagation();
      clearTimeout(holdTimer);
      if (holdTriggered) return;

      if (hasDouble) {
        const now = Date.now();
        if (now - lastTapAt < 300) {
          clearTimeout(tapTimer);
          lastTapAt = 0;
          this._handleAction(doubleTapAction, entityId);
        } else {
          lastTapAt = now;
          tapTimer = setTimeout(() => {
            this._handleAction(tapAction, entityId);
          }, 300);
        }
      } else {
        this._handleAction(tapAction, entityId);
      }
    });

    btn.addEventListener("pointerleave", () => { clearTimeout(holdTimer); });
  }

  _handleAction(action, entityId) {
    if (!action || !this._hass) return;
    switch (action.action) {
      case "toggle":
        this._hass.callService("homeassistant", "toggle", {}, { entity_id: entityId });
        break;
      case "more-info":
        this._moreInfo(action.entity_id || entityId);
        break;
      case "navigate":
        if (action.navigation_path) {
          window.history.pushState(null, "", action.navigation_path);
          window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true }));
        }
        break;
      case "url":
        if (action.url_path) {
          window.open(action.url_path, action.new_tab === false ? "_self" : "_blank");
        }
        break;
      case "call-service":
      case "perform-action": {
        const svc = action.service || action.perform_action;
        if (!svc || svc.indexOf(".") === -1) break;
        const [domain, service] = svc.split(".");
        const data = action.data || action.service_data || {};
        const target = action.target || { entity_id: entityId };
        this._hass.callService(domain, service, data, target);
        break;
      }
      case "none":
      default:
        break;
    }
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

class PrismRoomTileEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    if (this._activeDialog) this._activeDialog.hass = hass;
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    if (this._activeDialog) {
      this._activeDialog.remove();
      this._activeDialog = null;
    }
  }

  _fireChanged() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true, composed: true
    }));
  }

  _schema() {
    return [
      { name: "room_name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      { name: "entity", selector: { entity: {} } },
      { name: "navigation_path", selector: { text: {} } },
      { name: "temperature_entity", selector: { entity: { domain: "sensor" } } }
    ];
  }

  _labels(schemaName) {
    const map = {
      room_name: "Raumname",
      icon: "Icon",
      entity: "Haupt-Entity (f\u00fcr Glow, z.B. \"in Benutzung\")",
      navigation_path: "Navigations-Pfad",
      temperature_entity: "Temperatur-Entity"
    };
    return map[schemaName] || schemaName;
  }

  _entityName(entityId) {
    if (!entityId) return "(keine Entity)";
    const state = this._hass && this._hass.states[entityId];
    return (state && state.attributes.friendly_name) || entityId;
  }

  _panel(header, secondary, expanded, contentBuilder) {
    const panel = document.createElement("ha-expansion-panel");
    panel.outlined = true;
    panel.header = header;
    if (secondary) panel.secondary = secondary;
    panel.expanded = !!expanded;
    panel.style.display = "block";

    const inner = document.createElement("div");
    inner.style.display = "flex";
    inner.style.flexDirection = "column";
    inner.style.gap = "16px";
    inner.style.padding = "12px 16px 16px";
    contentBuilder(inner);

    panel.appendChild(inner);
    return panel;
  }

  _render() {
    if (!this._config) return;
    this.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "12px";
    wrapper.style.padding = "8px 0";

    // --- Inhalt: Grunddaten der Kachel -----------------------------------
    wrapper.appendChild(this._panel("Inhalt", "Name, Icon, Haupt-Entity, Navigation", true, (inner) => {
      inner.appendChild(this._colorPickerRow(
        "Akzentfarbe",
        this._config.accent_color || "#60a5fa",
        (hex) => {
          this._config = { ...this._config, accent_color: hex };
          this._fireChanged();
        }
      ));

      const form = document.createElement("ha-form");
      form.hass = this._hass;
      form.data = this._config;
      form.schema = this._schema();
      form.computeLabel = (s) => this._labels(s.name);
      form.addEventListener("value-changed", (ev) => {
        this._config = { ...this._config, ...ev.detail.value };
        this._fireChanged();
      });
      this._form = form;
      inner.appendChild(form);
    }));

    // --- Ecken-Icons -------------------------------------------------------
    wrapper.appendChild(this._panel(
      "Ecken-Icons",
      "Oben rechts, z.B. Fenster/Pr\u00e4senz",
      false,
      (inner) => inner.appendChild(this._renderListEditor("corner_entities", "Ecken-Icons"))
    ));

    // --- Info-Chips ----------------------------------------------------------
    wrapper.appendChild(this._panel(
      "Info-Chips",
      "Zus\u00e4tzliche Werte, z.B. Verbrauch",
      false,
      (inner) => inner.appendChild(this._renderListEditor("info_entities", "Info-Chips"))
    ));

    // --- Quick-Toggle-Icons ----------------------------------------------
    wrapper.appendChild(this._panel(
      "Quick-Toggle-Icons",
      "Unten mittig, mit eigenen Tap/Halten/Doppel-Tap-Aktionen",
      false,
      (inner) => inner.appendChild(this._renderListEditor("entities", "Quick-Toggle-Icons"))
    ));

    this.appendChild(wrapper);
  }

  _colorPickerRow(labelText, value, onChange) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";

    if (labelText) {
      const label = document.createElement("div");
      label.textContent = labelText;
      label.style.flex = "1";
      label.style.fontSize = "14px";
      row.appendChild(label);
    }

    const swatch = document.createElement("input");
    swatch.type = "color";
    swatch.value = this._toHex(value);
    swatch.style.width = "36px";
    swatch.style.height = "36px";
    swatch.style.border = "none";
    swatch.style.borderRadius = "8px";
    swatch.style.cursor = "pointer";
    swatch.style.background = "none";
    swatch.style.padding = "0";
    swatch.style.flexShrink = "0";

    const text = document.createElement("ha-textfield");
    text.value = value || "";
    text.style.width = "110px";

    swatch.addEventListener("input", () => {
      text.value = swatch.value;
      onChange(swatch.value);
    });
    text.addEventListener("change", (ev) => {
      const v = ev.target.value;
      swatch.value = this._toHex(v);
      onChange(v);
    });

    row.appendChild(swatch);
    row.appendChild(text);
    return row;
  }

  _toHex(value) {
    if (value && /^#[0-9a-fA-F]{6}$/.test(value)) return value;
    return "#60a5fa";
  }

  // Compact list: one summary row per item (icon + name), click opens an
  // ha-dialog popup to edit that single item -- matches the pattern used
  // by other HA cards (e.g. entities/area card row editors).
  _renderListEditor(key, title) {
    const section = document.createElement("div");
    section.style.display = "flex";
    section.style.flexDirection = "column";

    const list = this._config[key] || [];
    const listEl = document.createElement("div");
    listEl.style.display = "flex";
    listEl.style.flexDirection = "column";
    listEl.style.gap = "4px";
    listEl.style.marginBottom = "8px";

    list.forEach((item, index) => {
      listEl.appendChild(this._renderSummaryRow(key, index, item));
    });
    section.appendChild(listEl);

    // Keep a reference so item-dialog changes can refresh just this list,
    // without rebuilding the whole editor (which would collapse panels
    // and reset scroll position).
    this._listContainers = this._listContainers || {};
    this._listContainers[key] = listEl;

    const addBtn = document.createElement("mwc-button");
    addBtn.textContent = "+ Hinzuf\u00fcgen";
    addBtn.addEventListener("click", () => {
      const updated = [...(this._config[key] || []), { entity: "", icon: "mdi:help-circle", color: "#60a5fa" }];
      this._config = { ...this._config, [key]: updated };
      this._fireChanged();
      this._refreshList(key);
      this._openItemDialog(key, updated.length - 1, title);
    });
    section.appendChild(addBtn);

    return section;
  }

  // Re-render only the rows of one list (called after add/edit/delete in the
  // item popup) instead of the whole editor, so expansion-panel state and
  // scroll position stay untouched.
  _refreshList(key) {
    const listEl = this._listContainers && this._listContainers[key];
    if (!listEl) return;
    listEl.innerHTML = "";
    (this._config[key] || []).forEach((item, index) => {
      listEl.appendChild(this._renderSummaryRow(key, index, item));
    });
  }

  _renderSummaryRow(key, index, item) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.padding = "8px 10px";
    row.style.borderRadius = "8px";
    row.style.background = "var(--secondary-background-color, rgba(255,255,255,0.05))";
    row.style.cursor = "pointer";

    const swatch = document.createElement("div");
    swatch.style.width = "10px";
    swatch.style.height = "10px";
    swatch.style.borderRadius = "50%";
    swatch.style.background = item.color || "#60a5fa";
    swatch.style.flexShrink = "0";
    row.appendChild(swatch);

    const icon = document.createElement("ha-icon");
    icon.icon = item.icon || "mdi:help-circle";
    icon.style.flexShrink = "0";
    row.appendChild(icon);

    const name = document.createElement("div");
    name.textContent = this._entityName(item.entity);
    name.style.flex = "1";
    name.style.overflow = "hidden";
    name.style.textOverflow = "ellipsis";
    name.style.whiteSpace = "nowrap";
    row.appendChild(name);

    const editIcon = document.createElement("ha-icon");
    editIcon.icon = "mdi:pencil";
    editIcon.style.flexShrink = "0";
    editIcon.style.opacity = "0.6";
    row.appendChild(editIcon);

    row.addEventListener("click", () => this._openItemDialog(key, index));
    return row;
  }

  _openItemDialog(key, index, sectionTitle) {
    if (this._activeDialog) {
      this._activeDialog.remove();
      this._activeDialog = null;
    }

    const item = (this._config[key] || [])[index] || {};
    const dialog = document.createElement("ha-dialog");
    dialog.open = true;
    dialog.hass = this._hass;
    dialog.style.setProperty("--mdc-dialog-max-width", "420px");

    // We control our own header + scroll area inside the dialog instead of
    // relying purely on the dialog's own heading/content slots -- avoids
    // the top of the content (heading + entity picker) getting scrolled
    // out of view when the action selectors below it expand the dialog.
    const scroller = document.createElement("div");
    scroller.style.display = "flex";
    scroller.style.flexDirection = "column";
    scroller.style.gap = "16px";
    scroller.style.minWidth = "280px";
    scroller.style.maxHeight = "min(70vh, 640px)";
    scroller.style.overflowY = "auto";
    scroller.style.padding = "4px 2px";

    const heading = document.createElement("div");
    heading.textContent = sectionTitle || "Ger\u00e4t bearbeiten";
    heading.style.fontSize = "18px";
    heading.style.fontWeight = "600";
    heading.style.marginBottom = "4px";
    scroller.appendChild(heading);

    // Use the same ha-form + selector mechanism as the "Inhalt" panel above
    // (confirmed working there) instead of raw <ha-entity-picker>/<ha-icon-picker>
    // elements, which did not reliably render standalone inside this dialog.
    const detailForm = document.createElement("ha-form");
    detailForm.hass = this._hass;
    detailForm.data = { entity: item.entity || "", icon: item.icon || "" };
    detailForm.schema = [
      { name: "entity", selector: { entity: {} } },
      { name: "icon", selector: { icon: {} } }
    ];
    detailForm.computeLabel = (s) => (s.name === "entity" ? "Entity" : "Icon");
    detailForm.addEventListener("value-changed", (ev) => {
      this._updateListItem(key, index, ev.detail.value);
      this._refreshList(key);
    });
    scroller.appendChild(detailForm);

    scroller.appendChild(this._colorPickerRow(
      "Farbe",
      item.color || "#60a5fa",
      (hex) => { this._updateListItem(key, index, { color: hex }); this._refreshList(key); }
    ));

    // Full action config (tap/hold/double-tap) -- only for the quick-toggle
    // entity row, so it behaves like a proper device card per icon.
    if (key === "entities") {
      const actionsHeading = document.createElement("div");
      actionsHeading.textContent = "Aktionen";
      actionsHeading.style.fontWeight = "600";
      actionsHeading.style.marginTop = "4px";
      scroller.appendChild(actionsHeading);

      const actionsForm = document.createElement("ha-form");
      actionsForm.hass = this._hass;
      actionsForm.data = {
        tap_action: item.tap_action || this._defaultActionPreview(item.entity, "tap"),
        hold_action: item.hold_action || { action: "more-info" },
        double_tap_action: item.double_tap_action || { action: "none" }
      };
      actionsForm.schema = [
        { name: "tap_action", selector: { ui_action: {} } },
        { name: "hold_action", selector: { ui_action: {} } },
        { name: "double_tap_action", selector: { ui_action: {} } }
      ];
      actionsForm.computeLabel = (s) => {
        const map = {
          tap_action: "Tap-Aktion",
          hold_action: "Halten-Aktion",
          double_tap_action: "Doppel-Tap-Aktion"
        };
        return map[s.name] || s.name;
      };
      actionsForm.addEventListener("value-changed", (ev) => {
        this._updateListItem(key, index, ev.detail.value);
      });
      scroller.appendChild(actionsForm);
    }

    dialog.appendChild(scroller);

    const deleteBtn = document.createElement("mwc-button");
    deleteBtn.textContent = "L\u00f6schen";
    deleteBtn.style.setProperty("--mdc-theme-primary", "var(--error-color, #db4437)");
    deleteBtn.setAttribute("slot", "secondaryAction");
    deleteBtn.addEventListener("click", () => {
      const updated = (this._config[key] || []).filter((_, i) => i !== index);
      this._config = { ...this._config, [key]: updated };
      this._fireChanged();
      this._refreshList(key);
      dialog.open = false;
    });
    dialog.appendChild(deleteBtn);

    const doneBtn = document.createElement("mwc-button");
    doneBtn.textContent = "Fertig";
    doneBtn.setAttribute("slot", "primaryAction");
    doneBtn.addEventListener("click", () => { dialog.open = false; });
    dialog.appendChild(doneBtn);

    dialog.addEventListener("closed", () => {
      dialog.remove();
      this._activeDialog = null;
      this._refreshList(key);
    });

    this.appendChild(dialog);
    this._activeDialog = dialog;

    // Guarantee the scroll area starts at the top (heading + entity picker
    // visible) even if something inside tries to scroll a focused field
    // into view.
    requestAnimationFrame(() => {
      scroller.scrollTop = 0;
      requestAnimationFrame(() => { scroller.scrollTop = 0; });
    });
  }

  _defaultActionPreview(entityId, kind) {
    const domain = (entityId || "").split(".")[0];
    if (kind === "tap") {
      if (["climate", "media_player", "select", "sensor", "binary_sensor"].includes(domain)) {
        return { action: "more-info" };
      }
      return { action: "toggle" };
    }
    return { action: "none" };
  }

  _updateListItem(key, index, patch) {
    const updated = [...(this._config[key] || [])];
    updated[index] = { ...updated[index], ...patch };
    this._config = { ...this._config, [key]: updated };
    this._fireChanged();
  }
}

customElements.define("prism-room-tile-editor", PrismRoomTileEditor);
customElements.define("prism-room-tile", PrismRoomTile);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "prism-room-tile",
  name: "Prism Room Tile",
  description: "Glassmorphism Raum-Navigationskarte im Prism-Stil (Tap = Navigate, Mini-Icons togglebar)"
});
