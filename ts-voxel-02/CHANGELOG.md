# Changelog - ts-voxel-02

## [0.1.0] - 2025-10-17

### Initial Migration

#### ✅ Abgeschlossen
- Projekt-Analyse der alten Codebases (voxelsrv, voxelsrv-server)
- Monorepo-Struktur mit 4 Packages angelegt
- Dependencies auf neueste Versionen aktualisiert

#### Core Package (@voxel-02/core)
- Types: XYZ, XZ, Vector3, Rotation
- Helpers: Chunk-Koordinaten-Transformation
- Models: Entity, World, Chunk, Inventory

#### Protocol Package (@voxel-02/protocol)
- Proto-Dateien kopiert (client.proto, server.proto, world.proto)
- Handler-Interfaces erstellt
- Basis für Protobuf-Integration

#### Server Package (@voxel-02/server)
- **Registry-System**: Blocks, Items, Commands mit automatischer ID-Vergabe
- **World-Manager**: Multi-World-Support, Chunk-Cache, Auto-Save
- **World-Generatoren**:
  - FlatWorldGenerator (flache Welt mit Grass/Dirt/Stone-Layern)
  - NormalWorldGenerator (Simplex-Noise-Terrain mit Hügeln)
- **Entity-Manager**: UUID-basiert, Position/Rotation, Tick-System
- **WebSocket-Server**: Client-Verbindungen, Message-Handling (JSON)
- **Auto-Save**: Alle 30 Sekunden
- **Chunk-Persistence**: Komprimierte Speicherung (zlib)

#### Client Package (@voxel-02/client)
- **Babylon.js 7.x Integration**: Engine, Scene, Camera, Lights
- **Main Menu GUI**:
  - Server-Auswahl (Name, Adresse, Port)
  - Multiplayer-Verbindung
  - Singleplayer-Option (Embedded Server)
  - Logo-Integration
  - Styled Input-Fields und Buttons
- **Vite Dev-Server**: HMR, schnelle Builds
- **Assets**: 1896 Dateien (Texturen, Audio, Fonts, Models)

### Fixes
- **Workspace Dependencies**: `workspace:*` → `*` für npm-Kompatibilität
- **Build-Script**: `build:deps` baut automatisch core & protocol vor Server-Start
- **Protocol-Export**: Generated files optional gemacht

### Technical Details

**Dependencies-Upgrades:**
- TypeScript: 4.2.3 → 5.7.3
- Babylon.js: 5.0.0-alpha → 7.37.1 (stabil)
- Webpack → Vite
- Protobuf: 6.10.2 → 7.4.0
- WebSocket (ws): 7.4.4 → 8.18.0

**Removed Dependencies:**
- noa-engine → Native Babylon.js
- voxelservercore → Eigene Core-Implementation
- ndarray → Native Uint16Array

**Architecture:**
- ESM Modules (statt CommonJS)
- Monorepo mit npm Workspaces
- TypeScript 5.x mit strikter Config
- Saubere Package-Trennung

### Commands
```bash
# Installation
npm install

# Server starten
npm run dev:server

# Client starten
npm run dev:client

# Dependencies bauen
npm run build:deps
```

### Known Issues
- Protobuf-Code-Generierung noch nicht implementiert (aktuell JSON)
- Chunk-Rendering im Client fehlt noch
- WebSocket-Kommunikation Client-Server nicht implementiert
- Player-System fehlt noch
- GUI-System (HUD, Chat, Inventory) fehlt noch

### Next Steps
1. WebSocket-Integration (Client ↔ Server)
2. Chunk-Rendering im Client
3. Player-System mit Inventar
4. Protobuf-Integration (statt JSON)
5. GUI-System (HUD, Chat, Inventory)
6. Block-Interaktion

---

## Credits
Basiert auf **VoxelSrv** von **Patbox**
- Original: https://github.com/VoxelSrv/voxelsrv
- Migriert zu TypeScript 5.x + Babylon.js 7.x + ESM
