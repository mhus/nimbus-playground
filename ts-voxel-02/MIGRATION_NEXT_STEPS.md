# Nächste Schritte für vollständige Migration

## Aktueller Stand

✅ **Phase 1 & 2 abgeschlossen:**
- Projekt-Struktur (Monorepo, 4 Packages)
- Core Models & Types
- Server-Basis (World, Chunks, Entities, Registry)
- Client-Basis (Babylon.js, Main Menu GUI)
- Assets (1896 Dateien)

## Warum keine 1:1-Migration?

Das ursprüngliche `voxelsrv`-Projekt nutzt:
- **noa-engine**: Spezialisierte Voxel-Engine auf Babylon.js-Basis
- **Komplexes Worker-System**: Protocol-Worker, Inflate-Worker
- **Viele veraltete Dependencies**: Die nicht mehr mit modernen Tools funktionieren

**Herausforderungen:**
1. noa-engine ist eine GitHub-Dependency ohne npm-Release
2. Webpack 4 statt Vite
3. Alte Babylon.js 5.0-alpha
4. CommonJS statt ESM
5. TypeScript 4.2 statt 5.x

## Option 1: Vollständige noa-engine Migration (Komplex)

### Schritt 1: noa-engine integrieren

```bash
cd packages/client
npm install https://github.com/VoxelSrv/noa-engine
```

Problem: noa-engine ist nicht ESM-kompatibel und hat alte Dependencies.

### Schritt 2: Alte Client-Struktur kopieren

Kopiere aus `tmp/voxelsrv/src/`:
- `lib/gameplay/` → Chunk-Loading, Registry, World
- `lib/player/` → Controls, Entity
- `lib/helpers/` → Protocol, Assets, WorldInflate
- `gui/` → Alle GUI-Komponenten
- `socket.ts` → WebSocket-Handling

### Schritt 3: Dependencies anpassen

Ersetze:
```typescript
import { Engine } from 'noa-engine';
```

Mit modernen Imports.

**Aufwand: ~2-3 Tage**

## Option 2: Schrittweise Migration (Empfohlen)

### Phase A: Network & Protocol ✅ Wichtigste Priorität

1. **WebSocket-Integration**
   ```
   Datei: packages/client/src/network/WebSocketClient.ts

   Kopiere aus: tmp/voxelsrv/src/socket.ts
   - MPSocket-Klasse → WebSocketClient
   - Protocol-Handling
   - Event-System
   ```

2. **Protocol-Handler**
   ```
   Datei: packages/client/src/network/ProtocolHandler.ts

   Implementiere:
   - parseToMessage() - Client → Server
   - parseToObject() - Server → Client
   - Nutze @voxel-02/protocol
   ```

3. **Connection-Manager**
   ```
   Datei: packages/client/src/network/ConnectionManager.ts

   Kopiere aus: tmp/voxelsrv/src/lib/gameplay/connect.ts
   - connect() - Verbindung aufbauen
   - setupConnection() - Event-Handler registrieren
   ```

### Phase B: Chunk-Rendering

1. **Chunk-Loader**
   ```
   Datei: packages/client/src/world/ChunkLoader.ts

   Kopiere aus: tmp/voxelsrv/src/lib/gameplay/world.ts
   - loadChunk() - Chunk vom Server laden
   - unloadChunk() - Chunk entladen
   - Chunk-Cache
   ```

2. **Mesh-Generator**
   ```
   Datei: packages/client/src/rendering/MeshGenerator.ts

   Implementiere:
   - generateChunkMesh(chunkData) → Babylon.js Mesh
   - Greedy-Meshing-Algorithmus
   - Face-Culling (nur sichtbare Flächen)
   ```

3. **Texture-Atlas**
   ```
   Datei: packages/client/src/rendering/TextureAtlas.ts

   Implementiere:
   - createAtlas(textures) → Combined Texture
   - getUVCoords(blockId, face) → UV-Koordinaten
   ```

### Phase C: Player-System

1. **Player-Controller**
   ```
   Datei: packages/client/src/player/PlayerController.ts

   Kopiere aus: tmp/voxelsrv/src/lib/player/controls.ts
   - WASD-Movement
   - Jump/Crouch
   - Sprint
   ```

2. **Camera-Controller**
   ```
   Datei: packages/client/src/player/CameraController.ts

   Implementiere:
   - Mouse-Look
   - Pointer-Lock
   - FOV-Control
   ```

3. **Inventory**
   ```
   Datei: packages/client/src/player/Inventory.ts

   Kopiere aus: tmp/voxelsrv/src/lib/player/entity.ts
   - Hotbar (9 Slots)
   - Main Inventory (27 Slots)
   - Item-Stack-Management
   ```

### Phase D: GUI-System

1. **HUD**
   ```
   Datei: packages/client/src/gui/HUD.ts

   Kopiere aus: tmp/voxelsrv/src/gui/ingame/
   - Crosshair
   - Health-Bar
   - Hotbar mit Items
   - Coordinates
   ```

2. **Chat**
   ```
   Datei: packages/client/src/gui/Chat.ts

   Kopiere aus: tmp/voxelsrv/src/gui/ingame/chat/
   - Chat-History
   - Input-Field
   - Commands
   ```

3. **Inventory-UI**
   ```
   Datei: packages/client/src/gui/InventoryUI.ts

   Kopiere aus: tmp/voxelsrv/src/gui/ingame/inventory/
   - Slot-Grid
   - Drag & Drop
   - Crafting
   ```

### Phase E: Singleplayer

1. **Embedded Server**
   ```
   Datei: packages/client/src/singleplayer/EmbeddedServer.ts

   Kopiere aus: tmp/voxelsrv/src/lib/singleplayer/
   - Server im Browser starten
   - VirtualSocket (EventEmitter-based)
   - Shared-Memory zwischen Client/Server
   ```

## Pragmatischer Ansatz: Hybrid-Lösung

### Was wir behalten (neu implementiert):
- ✅ Moderne Babylon.js 7.x (statt noa-engine)
- ✅ TypeScript 5.x + ESM
- ✅ Vite (statt Webpack)
- ✅ Monorepo-Struktur
- ✅ Server-Architektur

### Was wir vom alten Client übernehmen:
1. **Protocol-Handling** (socket.ts) → Wichtigste Priorität
2. **Chunk-Loading-Logik** (lib/gameplay/world.ts)
3. **GUI-Komponenten** (gui/*)
4. **Player-Controls** (lib/player/controls.ts)

### Was wir neu implementieren:
1. **Chunk-Rendering** (ohne noa-engine)
2. **Physics** (Babylon.js Physics statt noa)
3. **Entity-Rendering** (native Babylon.js)

## Sofort umsetzbar (2-4 Stunden):

### 1. WebSocket-Verbindung

```typescript
// packages/client/src/network/WebSocketClient.ts
export class WebSocketClient {
  private ws: WebSocket;

  async connect(address: string, port: number) {
    this.ws = new WebSocket(`ws://${address}:${port}`);

    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data);
    };
  }

  send(type: string, data: any) {
    this.ws.send(JSON.stringify({ type, ...data }));
  }
}
```

### 2. Chunk-Request

```typescript
// Im VoxelClient
async connectToServer(serverInfo: ServerInfo) {
  const ws = new WebSocketClient();
  await ws.connect(serverInfo.address, serverInfo.port);

  // Request spawn chunks
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      ws.send('request_chunk', { chunkX: x, chunkZ: z });
    }
  }

  ws.on('chunk_data', (data) => {
    this.loadChunk(data);
  });
}
```

### 3. Einfaches Chunk-Rendering

```typescript
// packages/client/src/rendering/SimpleChunkRenderer.ts
export function renderChunk(chunkData: Uint16Array, scene: Scene) {
  const mesh = MeshBuilder.CreateBox('chunk', { size: 1 }, scene);

  // Erstelle Material mit Texture
  const material = new StandardMaterial('chunkMat', scene);
  material.diffuseTexture = new Texture('/textures/stone.png', scene);
  mesh.material = material;

  return mesh;
}
```

## Empfehlung

**Für produktives Ergebnis:**
1. Starte mit **Option 2, Phase A** (WebSocket + Protocol)
2. Implementiere **einfaches Chunk-Rendering** (Würfel pro Block)
3. Optimiere später mit **Greedy-Meshing**

**Für 1:1-Migration:**
1. Nutze das alte Projekt als Referenz
2. Kopiere Dateien einzeln und passe an ESM an
3. Ersetze noa-engine-spezifische Teile durch Babylon.js

## Hilfreiche Dateien zum Kopieren

**Wichtigste Priorität:**
1. `tmp/voxelsrv/src/socket.ts` → WebSocket-Handling
2. `tmp/voxelsrv/src/lib/gameplay/connect.ts` → Connection-Setup
3. `tmp/voxelsrv/src/lib/gameplay/world.ts` → Chunk-Loading
4. `tmp/voxelsrv/src/lib/helpers/protocol.ts` → Protocol-Helpers

**Mittlere Priorität:**
5. `tmp/voxelsrv/src/lib/player/controls.ts` → Player-Controls
6. `tmp/voxelsrv/src/gui/ingame/hud.ts` → HUD
7. `tmp/voxelsrv/src/lib/gameplay/registry.ts` → Block/Item-Registry

**Niedrige Priorität:**
8. GUI-Menüs (haben wir neu implementiert)
9. Settings-System
10. Mobile-Controls

## Zeitaufwand-Schätzung

- **WebSocket + Basic-Chunks**: 4-6 Stunden
- **Optimiertes Rendering**: 8-12 Stunden
- **Player-System**: 4-6 Stunden
- **GUI (HUD, Chat, Inventory)**: 12-16 Stunden
- **Singleplayer**: 6-8 Stunden

**Total für funktionierende Welt**: ~10-20 Stunden
**Total für Feature-Complete**: ~40-50 Stunden
