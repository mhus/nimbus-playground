# Quick Start Guide

## Ersteinrichtung

```bash
# Im Root-Verzeichnis
cd ts-voxel-01

# Dependencies installieren
npm install

# Core und Protocol bauen
cd packages/core && npm run build && cd ../..
cd packages/protocol && npm run build && cd ../..
```

## Development

### Option 1: Beide Server gleichzeitig starten

Öffnen Sie zwei Terminals:

**Terminal 1 - Server:**
```bash
cd ts-voxel-01
npm run dev:server
```

Der Server läuft auf `ws://localhost:3000`

**Terminal 2 - Client:**
```bash
cd ts-voxel-01
npm run dev
```

Der Client läuft auf `http://localhost:5173` (oder 5174, falls 5173 belegt ist)

### Option 2: Nur Client (ohne Backend)

Sie können auch nur den Client starten - er zeigt ein Login-Menü, funktioniert aber erst, wenn der Server läuft.

```bash
cd ts-voxel-01
npm run dev
```

## Verwendung

1. Öffnen Sie `http://localhost:5173` (oder den Port den Vite anzeigt) im Browser
2. Geben Sie einen Spielernamen ein
3. Klicken Sie auf "Connect"
4. Verwenden Sie:
   - **WASD** - Bewegen
   - **Space** - Hoch
   - **Shift** - Runter
   - **Maus** - Umsehen (nach dem Klick auf das Canvas)
   - **ESC** - Mauszeiger freigeben

## Build für Production

```bash
cd ts-voxel-01

# Alles bauen
npm run build

# Oder einzeln
npm run build:client
npm run build:server
```

## Probleme?

**Port 3000 bereits belegt:**
```bash
# Prozess auf Port 3000 finden und beenden
lsof -ti:3000 | xargs kill
```

**Port 5173 bereits belegt:**
Vite wechselt automatisch zu 5174, 5175 usw.

**Module nicht gefunden:**
```bash
# Dependencies neu installieren
npm install
cd packages/core && npm run build
cd ../protocol && npm run build
```

## Was funktioniert aktuell?

- ✅ 3D-Voxel-Welt Rendering
- ✅ Terrain-Generierung
- ✅ First-Person Kamera
- ✅ WebSocket-Kommunikation
- ✅ Multiplayer-Verbindung

## Was fehlt noch?

- ⏳ Block Break/Place
- ⏳ Andere Spieler sichtbar
- ⏳ Chat-System
- ⏳ Texturen (aktuell nur Farben)
- ⏳ Collision Detection
