# VoxelSrv Client

Browser-basierter 3D-Client für VoxelSrv mit Babylon.js.

## Features

- ✅ **Main Menu** mit Server-Auswahl
- ✅ **Singleplayer** (Embedded Server)
- ✅ **Multiplayer** (WebSocket-Verbindung)
- ✅ **Babylon.js 7.x** 3D-Engine
- ✅ **Babylon.js GUI** für Menüs
- ✅ **Vite** Dev-Server mit HMR

## Development

```bash
npm run dev
```

Client startet auf: http://localhost:3000

## Main Menu

Beim Start erscheint das Main Menu mit:

### Multiplayer
- Server Name eingeben
- Server-Adresse (z.B. `localhost`)
- Port (z.B. `3001`)
- Button: "Connect to Server"

### Singleplayer
- Button: "Play Singleplayer"
- Startet embedded Server im Browser

## Steuerung

Nach dem Connect:
- **WASD**: Bewegen
- **Maus**: Umschauen
- **Leertaste**: Nach oben
- **Shift**: Nach unten

## Struktur

```
src/
├── VoxelClient.ts          # Haupt-Client-Klasse
├── gui/
│   └── MainMenu.ts         # Main Menu GUI
├── network/
│   └── NetworkManager.ts   # WebSocket-Kommunikation (TODO)
├── rendering/
│   └── ChunkRenderer.ts    # Chunk-Rendering (TODO)
└── index.ts                # Entry Point
```

## Assets

Alle Assets sind in `public/`:
- `textures/` - Block/Item-Texturen
- `audio/` - Sounds
- `fonts/` - Schriftarten
- `models/` - 3D-Models

## Nächste Schritte

1. WebSocket-Integration
2. Chunk-Rendering
3. Block-Interaktion
4. HUD (Health, Inventory-Bar)
5. Chat-System
