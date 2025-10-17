# Quick Start Guide - ts-voxel-02

Schnelleinstieg in das migrierte VoxelSrv-Projekt.

## Voraussetzungen

- Node.js 18+
- npm 9+
- Git

## Installation

```bash
cd ts-voxel-02
npm install
```

Dies installiert alle Dependencies für alle Packages im Monorepo.

## Development-Modus

### Server starten

```bash
npm run dev:server
```

Der Server startet auf Port **3001** und:
- Lädt oder erstellt eine Welt namens "world"
- Generiert Terrain mit Simplex-Noise
- Startet WebSocket-Server
- Speichert Chunks automatisch alle 30 Sekunden

**Ausgabe:**
```
[Registry] Loaded block palette with 4 blocks
[Registry] Finalized 4 blocks, 3 items, 0 commands
[WorldManager] Created world "world" with seed 123456
[Server] Server started on port 3001
[Server] World: world (seed: 123456)
[Server] Generator: normal
```

### Client starten

```bash
npm run dev:client
```

Der Client startet auf Port **3000** und öffnet automatisch im Browser:
- Babylon.js 3D-Engine
- FreeCamera mit WASD-Steuerung
- Placeholder-Scene (Ground + Box)

**URL:** http://localhost:3000

## Projekt bauen

### Alle Packages bauen

```bash
npm run build
```

### Einzelne Packages bauen

```bash
# Core
cd packages/core
npm run build

# Protocol
cd packages/protocol
npm run build

# Server
cd packages/server
npm run build

# Client
cd packages/client
npm run build
```

## Projektstruktur verstehen

```
ts-voxel-02/
├── packages/
│   ├── core/           # Gemeinsame Typen & Models
│   ├── protocol/       # Protobuf-Definitionen
│   ├── server/         # Node.js Server
│   └── client/         # Browser Client (Babylon.js)
├── package.json        # Root Workspace
└── MIGRATION_PLAN.md  # Detaillierter Plan
```

## Server konfigurieren

**Datei:** `packages/server/src/index.ts`

```typescript
const server = new VoxelServer({
  port: 3001,              // WebSocket-Port
  worldName: 'world',      // Welt-Name
  worldSeed: 123456,       // Seed (oder Math.random())
  generator: 'normal',     // 'flat' oder 'normal'
});
```

### Generator-Typen

**flat**: Flache Welt
- Gras-Layer bei Y=63
- Dirt-Layer Y=58-62
- Stone-Layer Y=0-57

**normal**: Terrain mit Simplex-Noise
- Hügel und Täler
- Base-Height: 64
- Variation: ±32 Blöcke

## Welt-Daten

Welten werden in `./worlds/` gespeichert:

```
worlds/
├── world/
│   ├── world.json       # Metadata (seed, generator, etc.)
│   └── chunks/
│       ├── 0,0.chk      # Chunk-Daten (komprimiert)
│       ├── 0,1.chk
│       └── ...
└── blocks.json          # Block-ID-Palette
```

### Welt löschen

```bash
rm -rf worlds/world
```

Beim nächsten Start wird eine neue Welt generiert.

## Client anpassen

**Datei:** `packages/client/src/VoxelClient.ts`

### Kamera-Position ändern

```typescript
this.camera = new FreeCamera('camera', new Vector3(0, 100, -50), this.scene);
```

### Himmel-Farbe ändern

```typescript
this.scene.clearColor.set(0.5, 0.7, 1.0, 1.0);  // R, G, B, A
```

### Kamera-Speed anpassen

```typescript
this.camera.speed = 1.0;  // Schneller
this.camera.angularSensibility = 1000;  // Empfindlicher
```

## Blöcke hinzufügen

**Datei:** `packages/server/src/VoxelServer.ts`

```typescript
private registerDefaultBlocks(): void {
  // Neuen Block hinzufügen
  this.registry.addBlock({
    id: 4,                    // Wird automatisch vergeben
    name: 'wood',
    solid: true,
    transparent: false,
    texture: 'wood',
    hardness: 2,
    miningtime: 1.0,
    tool: 'axe',
  });
}
```

## Troubleshooting

### Port 3001 bereits in Verwendung

Server-Port ändern:
```typescript
const server = new VoxelServer({
  port: 3002,  // Anderen Port verwenden
  // ...
});
```

### Port 3000 bereits in Verwendung

Vite verwendet automatisch den nächsten freien Port (3001, 3002, etc.)

### "Cannot find module '@voxel-02/core'"

```bash
# Build ausführen
npm run build

# Oder nur core bauen
cd packages/core
npm run build
```

### Welt wird nicht gespeichert

Prüfe Berechtigungen für `./worlds/` Ordner:
```bash
mkdir -p worlds
chmod 755 worlds
```

## Performance-Tipps

### Server

- **Chunk-Unload-Zeit reduzieren**: `world/World.ts`, Zeile ~301
  ```typescript
  const maxAge = 30000; // 30 statt 60 Sekunden
  ```

- **Auto-Save-Intervall anpassen**: `world/World.ts`, Zeile ~75
  ```typescript
  this.autoSaveInterval = setInterval(() => {
    this.autoSave();
  }, 60000); // 60 statt 30 Sekunden
  ```

### Client

- **FPS limitieren**:
  ```typescript
  this.engine.stopRenderLoop();
  setInterval(() => {
    this.scene?.render();
  }, 1000 / 60); // 60 FPS
  ```

## Nächste Schritte

1. **Client-Server-Kommunikation**
   - WebSocket-Verbindung im Client
   - Chunk-Anfragen senden
   - Chunk-Daten empfangen

2. **Chunk-Rendering**
   - Mesh-Generierung aus Chunk-Daten
   - Greedy-Meshing für Performance
   - Texture-Atlas

3. **Player-System**
   - Spawn-Position
   - Inventar
   - Bewegung (Server-Validierung)

4. **GUI**
   - Main-Menu
   - In-Game HUD
   - Chat
   - Inventar

## Weitere Dokumentation

- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) - Detaillierter Migrationsplan
- [STATUS.md](./STATUS.md) - Aktueller Projektstatus
- [README.md](./README.md) - Projekt-Übersicht

## Support & Beiträge

Basiert auf VoxelSrv von Patbox: https://github.com/VoxelSrv

Bei Fragen oder Problemen siehe die Original-Dokumentation oder erstelle ein Issue.
