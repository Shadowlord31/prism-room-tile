# Prism Room Tile

Eigene Home Assistant Lovelace-Karte: Look im [Prism-Dashboard](https://github.com/BangerTech/Prism-Dashboard)-Stil (Glassmorphism), Verhalten wie eine klassische Room-Navigationskarte (Tap = Navigate, kein Popup).

## Features

- Glassmorphism-Optik: Frosted-Glass-Hintergrund, weicher Farb-Glow, Icon-Badge mit Status-Glow
- **Tap auf die Karte navigiert direkt** zu einer Unteransicht (`navigation_path`) – kein Popup
- Ecken-Icons oben rechts (z. B. Fenster, Präsenz) mit eigenem Tap (more-info)
- Mittig zentrierte Icon-Reihe unten für Quick-Toggles (Licht, Heizung, Steckdose, Rollo, ...)
  - Tap = toggle, Long-Press = more-info
- Status-Zeile (z. B. Temperatur) unter dem Raumnamen

## Installation

### HACS (Custom Repository)

1. HACS → Frontend → Custom Repositories
2. Repository: `https://github.com/Shadowlord31/prism-room-tile`, Kategorie: `Dashboard` (bzw. `Lovelace`)
3. "Prism Room Tile" suchen und installieren

### Manuell

1. `prism-room-tile.js` nach `/config/www/` kopieren
2. Settings → Dashboards → Resources → Ressource hinzufügen: `/local/prism-room-tile.js`, Typ: JavaScript-Modul

## Verwendung

```yaml
type: custom:prism-room-tile
room_name: Wohnzimmer
icon: mdi:sofa
accent_color: "#a78bfa"
entity: binary_sensor.wohnzimmer_in_benutzung
navigation_path: /prism-dashboard/wohnzimmer
temperature_entity: sensor.temp_wz_temperatur
corner_entities:
  - entity: binary_sensor.fenster_wz_gruppe
    icon: mdi:window-closed-variant
  - entity: binary_sensor.presence_sensor_tv_cb04_belegung
    icon: mdi:motion-sensor
entities:
  - entity: light.licht_wohnzimmer_gruppe
    icon: mdi:lightbulb
    color: "#ffc864"
  - entity: climate.better_therm_wz
    icon: mdi:radiator
    color: "#fb923c"
  - entity: switch.steckdose_couch
    icon: mdi:power-plug
    color: "#4ade80"
  - entity: cover.rollo_wz_links
    icon: mdi:blinds
    color: "#22d3ee"
grid_options:
  columns: 12
```

## Konfigurationsoptionen

| Option | Typ | Beschreibung |
|---|---|---|
| `room_name` | string | Angezeigter Raumname |
| `icon` | string | MDI-Icon im Kopf-Badge |
| `accent_color` | string | Akzentfarbe (Glow, Badge, Standardfarbe für Buttons) |
| `entity` | string | Optionale Entity, deren "on"-Zustand das Kopf-Icon zum Glühen bringt (z. B. "in Benutzung") |
| `navigation_path` | string | Ziel-Pfad beim Tap auf die Karte |
| `temperature_entity` | string | Wird in der Statuszeile angezeigt |
| `corner_entities` | list | `{entity, icon, color}` – oben rechts, Tap öffnet more-info |
| `info_entities` | list | `{entity, icon}` – zusätzliche Info-Chips unter dem Kopf |
| `entities` | list | `{entity, icon, color}` – Quick-Toggle-Icons unten, mittig zentriert |
| `grid_options` | object | Standard-HA Sections-Grid-Optionen (z. B. `columns: 12`) |

## Lizenz

MIT
