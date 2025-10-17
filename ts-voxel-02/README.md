# ts-voxel-02

Moderne TypeScript Voxel-Engine mit 3D-Rendering (Babylon.js) und Multiplayer-Support.

## Projektstruktur

```
ts-voxel-02/
├── packages/
│   ├── core/           # Gemeinsame Models, Types, Utilities
│   ├── protocol/       # Protobuf Definitionen und Handler
│   ├── server/         # Server mit World-Generator
│   └── client/         # 3D Client (Babylon.js + Vite)
├── tmp/                # Alte Projekte (voxelsrv, voxelsrv-server)
├── package.json        # Root Workspace Config
└── MIGRATION_PLAN.md  # Detaillierter Migrationsplan
```

## Status

### ✅ Abgeschlossen
- Projekt-Analyse der alten Codebases
- Dependencies-Analyse und Upgrade-Plan
- Monorepo-Struktur mit Workspaces
- **Core Package**: Types, Helpers, Models (Entity, World, Inventory)
- **Protocol Package**: Proto-Dateien kopiert, Handler-Basis erstellt

### 🚧 In Arbeit
- Protobuf Code-Generierung
- Controller und Manager Migration

### 📋 Geplant
- Server-Package Implementation
- Client-Package Implementation
- Assets-Migration (Texturen, Audio, Models)
- Testing und Integration

## Installation

```bash
# Dependencies installieren
npm install

# Alle Packages bauen
npm run build
```

## Development

```bash
# Client Dev-Server starten
npm run dev:client

# Server Dev-Mode
npm run dev:server
```

## Packages

### @voxel-02/core
Gemeinsame Typen, Modelle und Utilities:
- **Types**: XYZ, XZ, Vector3, Rotation
- **Helpers**: Chunk-Koordinaten-Transformation, Seeds
- **Models**: Entity, World, Chunk, Block, Item, Inventory

### @voxel-02/protocol
Protobuf-basierte Netzwerk-Kommunikation:
- **Proto Files**: client.proto, server.proto, world.proto
- **Handlers**: Client- und Server-seitige Message-Handler
- **Messages**: Login, Movement, Block-Updates, Entity-Updates, Chat

### @voxel-02/server
Node.js Server mit WebSocket:
- World-Management (Chunks, Entities)
- Player-Management
- World-Generator (Flat, Normal, Custom)
- Block/Item Registry
- Chat-System
- Permissions-System

### @voxel-02/client
Browser-basierter 3D Client:
- Babylon.js 7.x für Rendering
- Vite für Dev-Server und Build
- Chunk-Rendering mit LOD
- Entity-Rendering
- GUI (Menu, HUD, Inventory, Chat)
- Input-Handling (Keyboard, Mouse, Touch)

## Technologie-Stack

### Core
- TypeScript 5.x
- ESM Modules
- Protobuf 7.x

### Server
- Node.js mit ws (WebSocket)
- Open-Simplex-Noise (World-Generation)
- UUID für Entity-IDs

### Client
- Babylon.js 7.x (3D Engine)
- Vite (Build-Tool)
- Native WebSocket

## Protobuf Messages

### Server → Client
- LoginRequest, LoginSuccess
- PlayerTeleport, PlayerInventory, PlayerHealth
- WorldChunkLoad, WorldBlockUpdate
- EntityCreate, EntityMove, EntityRemove
- ChatMessage, SoundPlay

### Client → Server
- LoginResponse
- ActionMove, ActionLook, ActionMoveLook
- ActionBlockPlace, ActionBlockBreak
- ActionMessage (Chat)
- ActionInventoryClick

## Migrierte Strukturen

### Entity System
- `EntityData`: Position, Rotation, Health, Model, Texture
- `IEntity`: Interface mit move(), rotate(), teleport()
- `EntityType`: Type-Definitionen für verschiedene Entity-Arten

### World System
- `ChunkData`: Block-Data als Uint16Array
- `WorldConfig`: Name, Seed, Generator-Type
- `BlockType`: Block-Eigenschaften (solid, transparent, texture)
- `ItemType`: Item-Eigenschaften (stackSize, tool)

### Inventory System
- `IInventory`: Base-Interface mit getItem(), setItem(), addItem()
- `PlayerInventory`: 36 Slots (9 Hotbar + 27 Main)
- `ArmorInventory`: 4 Slots (Helmet, Chestplate, Leggings, Boots)

## Nächste Schritte

1. **Protobuf Code-Generation**
   ```bash
   cd packages/protocol
   npm run generate
   ```

2. **Server-Implementation**
   - World-Manager aus altem Server übernehmen
   - Entity-Manager implementieren
   - WebSocket-Server mit Protocol-Integration

3. **Client-Implementation**
   - Babylon.js Scene-Setup
   - Chunk-Rendering-System
   - Network-Layer mit WebSocket

4. **Assets-Migration**
   - Texturen aus `tmp/voxelsrv/dist/textures/`
   - Audio aus `tmp/voxelsrv/dist/audio/`
   - Models aus `tmp/voxelsrv/dist/models/`

## Unterschiede zum alten Projekt

### Verbessert
- ✅ TypeScript 5.x (statt 4.2.3)
- ✅ Vite (statt Webpack 4)
- ✅ Babylon.js 7.x stabil (statt 5.0 Alpha)
- ✅ ESM statt CommonJS
- ✅ Monorepo mit Workspaces
- ✅ Protobuf 7.x (statt 6.x)
- ✅ ws 8.x (statt 7.x)

### Ersetzt
- ❌ noa-engine → Native Babylon.js
- ❌ voxelservercore → Eigene Core-Implementation
- ❌ ent-comp → Eigenes Entity-System

## Lizenz

MIT

## Credits

Basierend auf VoxelSrv von Patbox (https://github.com/VoxelSrv)
