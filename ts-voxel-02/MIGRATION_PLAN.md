# ts-voxel-02 Migration Plan

## Übersicht
Migration von voxelsrv (Client) und voxelsrv-server (Server) zu einer modernen Monorepo-Struktur mit aktuellen Dependencies.

## Projektstruktur

```
ts-voxel-02/
├── packages/
│   ├── core/           # Gemeinsame Models, Types, Utilities
│   ├── protocol/       # Protobuf Definitionen und generierter Code
│   ├── server/         # Server mit Demo-World-Generator
│   └── client/         # 3D Client (Babylon.js)
├── package.json        # Root package.json für Workspace
└── tsconfig.json       # Root TypeScript Config
```

## Dependencies-Upgrade

### Core Dependencies
- TypeScript: 4.2.3 → 5.x
- protobufjs: 6.10.2 → 7.x
- ws: 7.4.4 → 8.x

### Client Dependencies
- @babylonjs/core: 5.0.0-alpha.14 → neueste stabile (7.x)
- @babylonjs/gui: 5.0.0-alpha.14 → neueste stabile (7.x)
- @babylonjs/materials: 5.0.0-alpha.14 → neueste stabile (7.x)
- Webpack 4 → Vite (moderner, schneller)
- noa-engine (GitHub) → Ersetzen durch native Babylon.js

### Zu ersetzende Dependencies
- `voxelservercore` → Eigene Implementierung in core package
- `noa-engine` → Native Babylon.js Implementierung
- `ent-comp` → Eigenes Entity-Component-System

## Migration Steps

### Phase 1: Projektstruktur (AKTUELL)
1. ✅ Analyse abgeschlossen
2. ⏳ Erstelle Monorepo-Struktur
3. ⏳ Setup package.json für alle Packages
4. ⏳ Setup TypeScript configs

### Phase 2: Core Package
1. Migriere Types aus voxelsrv-server/src/types.ts
2. Migriere Entity-Models (entity.ts)
3. Migriere World-Models (world.ts, chunk structures)
4. Migriere Helper-Functions (helper.ts)
5. Erstelle gemeinsame Interfaces

### Phase 3: Protocol Package
1. Kopiere .proto Files:
   - client.proto
   - server.proto
   - world.proto (aus voxelsrv-server/src/formats/)
2. Setup protobuf Codegen
3. Erstelle TypeScript Wrapper für Messages
4. Erstelle Protocol Handlers/Sender

### Phase 4: Server Package
1. Migriere World-System:
   - World Manager
   - Chunk Management
   - World Generator
2. Migriere Entity-System:
   - Entity Manager
   - Entity Tick-System
3. Migriere Player-System:
   - Player Class
   - Player Manager
   - Inventory System
4. Migriere Registry-System:
   - Block Registry
   - Item Registry
5. Migriere Chat-System
6. Migriere Permissions-System
7. Migriere Console-System
8. Setup WebSocket Server mit Protocol Integration

### Phase 5: Client Package
1. Setup Vite + Babylon.js
2. Erstelle Scene Manager
3. Migriere Rendering:
   - Chunk Renderer
   - Block Renderer
   - Entity Renderer
4. Migriere Input-System:
   - Keyboard/Mouse Controls
   - Touch Controls (Mobile)
5. Migriere GUI-System:
   - Main Menu
   - Ingame HUD
   - Inventory UI
   - Chat UI
6. Migriere Physics (oder nutze Babylon.js Physics)
7. Migriere Network-Layer mit Protocol

### Phase 6: Assets
1. Kopiere Texturen aus dist/textures/
2. Kopiere Audio aus dist/audio/
3. Kopiere Fonts aus dist/fonts/
4. Kopiere Models aus dist/models/
5. Kopiere Server-Icons aus dist/servericons/

### Phase 7: Testing & Polish
1. Teste Server standalone
2. Teste Client mit embedded Server
3. Teste Client mit remote Server
4. Performance-Optimierung
5. Dokumentation

## Technologie-Entscheidungen

### Warum Babylon.js statt noa-engine?
- noa-engine ist eine GitHub-Dependency, schlecht wartbar
- Babylon.js ist aktiv maintained, große Community
- Moderne Features (PBR, Post-Processing, Physics)
- Bessere TypeScript-Integration

### Warum Vite statt Webpack?
- Deutlich schnellerer Dev-Server (ESM-based)
- Out-of-the-box TypeScript Support
- Einfachere Konfiguration
- Moderner Standard

### Warum Monorepo?
- Code-Sharing zwischen Client/Server
- Konsistente Dependency-Versions
- Einfacheres Refactoring
- Bessere Developer Experience

## Protobuf Messages (Übersicht)

### Server → Client
- LoginRequest, LoginSuccess, LoginStatus
- PlayerTeleport, PlayerInventory, PlayerHealth
- EntityCreate, EntityMove, EntityRemove
- WorldChunkLoad, WorldChunkUnload, WorldBlockUpdate
- ChatMessage, SoundPlay
- EnvironmentFogUpdate, EnvironmentSkyUpdate

### Client → Server
- LoginResponse
- ActionMove, ActionLook, ActionMoveLook
- ActionBlockPlace, ActionBlockBreak
- ActionInventoryClick, ActionMessage
- ActionClick, ActionClickEntity

## Models aus voxelsrv-server

### Entity System
- `EntityData`: Position, Rotation, Health, Model, Texture, Hitbox
- `IEntity`: Interface für alle Entities
- `Entity`: Base-Class mit move(), rotate(), teleport()

### World System
- `World`: Haupt-World-Class
- `Chunk`: Chunk-Datenstruktur
- `WorldManager`: Verwaltet mehrere Welten

### Inventory System
- `PlayerInventory`: Player-spezifisches Inventar
- `ArmorInventory`: Rüstungs-Slots
- `GeneralInventory`: Basis-Inventar-Interface

### Registry
- Block-Registry mit IDs
- Item-Registry mit IDs
- Serialisierung für Netzwerk-Transfer

## Nächste Schritte
1. Erstelle Package-Struktur
2. Setup package.json und tsconfig.json
3. Beginne mit core Package Migration
