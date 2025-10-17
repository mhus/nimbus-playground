# Voxel Game - TypeScript Edition

Eine moderne 3D-Voxel-Welt basierend auf TypeScript, BabylonJS und WebSockets.

## Projektstruktur

```
ts-voxel-01/
├── packages/
│   ├── client/          # 3D-Client (BabylonJS + Vite)
│   ├── server/          # WebSocket-Server (Node.js)
│   ├── protocol/        # Shared protocol definitions
│   └── core/            # Shared core logic
├── package.json         # Root workspace config
└── tsconfig.base.json   # Base TypeScript config
```

## Technologie-Stack

### Client
- **BabylonJS 8.x**: Moderne 3D-Engine
- **Vite 7.x**: Schneller Build-Tool (ersetzt Webpack 4)
- **TypeScript 5.x**: Type-safe development

### Server
- **Node.js**: Native ESM support
- **WebSockets (ws 8.x)**: Echtzeit-Kommunikation
- **Open Simplex Noise**: Terrain-Generierung

### Shared
- **TypeScript Project References**: Type-safe module resolution
- **npm Workspaces**: Monorepo-Management

## Änderungen gegenüber den alten Projekten

### Ersetzt/Aktualisiert
- ✅ **Webpack 4 → Vite 7**: Deutlich schnellere Entwicklungszeiten
- ✅ **BabylonJS 5.0-alpha → 8.32**: Stabile, aktuelle Version
- ✅ **TypeScript 4.2 → 5.9**: Moderne TypeScript-Features
- ✅ **ws 7.4 → 8.18**: Aktualisierte WebSocket-Library
- ✅ **Native ES Modules**: Kein CommonJS mehr

### Entfernt/Ersetzt durch moderne Alternativen
- ❌ **threads**: Ersetzt durch native Web Workers (falls benötigt)
- ❌ **node-fetch**: Node.js >=18 hat native fetch API
- ❌ **webpack-dev-server**: Ersetzt durch Vite Dev Server
- ❌ **memfs**: Kann durch IndexedDB ersetzt werden (falls benötigt)
- ❌ **voxelsrv-protocol (GitHub)**: Integriert in @voxel/protocol

## Installation

```bash
# Install dependencies
npm install

# Build all packages
npm run build
```

## Development

### Server starten

```bash
npm run dev:server
```

Der Server läuft auf `ws://localhost:3000`

### Client starten

```bash
npm run dev
```

Der Client läuft auf `http://localhost:5173`

## Verwendung

1. Starten Sie zunächst den Server
2. Starten Sie dann den Client
3. Öffnen Sie `http://localhost:5173` im Browser
4. Geben Sie einen Spielernamen ein
5. Klicken Sie auf "Connect"
6. Verwenden Sie **WASD** zum Bewegen, **Space/Shift** für hoch/runter
7. Klicken Sie auf das Canvas, um den Mauszeiger zu sperren

## Features

### Aktuell implementiert
- ✅ 3D-Voxel-Rendering mit BabylonJS
- ✅ Terrain-Generierung mit Simplex Noise
- ✅ WebSocket-basierte Client-Server-Kommunikation
- ✅ First-Person-Kamera mit Maus und Tastatur
- ✅ Chunk-basiertes Weltmanagement
- ✅ Debug-UI mit FPS, Position und Chunk-Count

### Geplant
- ⏳ Block-Break/Place Funktionalität
- ⏳ Multiplayer (mehrere Spieler sichtbar)
- ⏳ Chat-System
- ⏳ Inventar-System
- ⏳ gRPC-Schnittstelle für Backend
- ⏳ Texture-Mapping statt Vollfarben
- ⏳ Collision Detection
- ⏳ Physik-Engine

## Dependencies-Übersicht

### Kritische Updates

| Dependency | Alt | Neu | Änderung |
|------------|-----|-----|----------|
| `@babylonjs/core` | 5.0.0-alpha.14 | 8.32.0 | Major Update |
| `typescript` | 4.2.3 | 5.9.3 | Major Update |
| `webpack` | 4.46.0 | - | **Ersetzt durch Vite** |
| `ws` | 7.4.4 | 8.18.3 | Major Update |

### Beibehaltene Dependencies
- `gl-vec3`: Vector-Mathematik
- `ndarray`: Array-Datenstrukturen
- `open-simplex-noise`: Terrain-Generierung
- `pako`: Kompression (für zukünftige Verwendung)

## Migration von den alten Projekten

Die wichtigsten Komponenten aus `voxelsrv` und `voxelsrv-server` wurden in die neue Struktur übernommen:

### Client (voxelsrv)
- World-Rendering → `packages/client/src/game/WorldRenderer.ts`
- Network-Layer → `packages/client/src/game/NetworkClient.ts`
- Input-Handling → `packages/client/src/game/InputManager.ts`

### Server (voxelsrv-server)
- World-Management → `packages/server/src/world/World.ts`
- Terrain-Generation → `packages/server/src/world/WorldGenerator.ts`
- Player-Management → `packages/server/src/player.ts`

### Shared
- Types → `packages/core/src/types/index.ts`
- Protocol → `packages/protocol/src/index.ts`

## Nächste Schritte

1. **Texture-System implementieren**: Aktuell nur Vollfarben
2. **Block-Interaktion**: Break/Place mit Raycast
3. **Multiplayer sichtbar machen**: Andere Spieler rendern
4. **gRPC-Backend**: Separater Server mit gRPC-API
5. **Optimierungen**: Greedy Meshing, LOD, Frustum Culling

## Lizenz

MIT
