# Testing Guide - ts-voxel-02

## Current Status

✅ **Completed Integration (2025-10-17)**
- WebSocket client migrated from old voxelsrv
- ChunkManager migrated from old voxelsrv
- ChunkRenderer implemented with Babylon.js
- VoxelClient integration complete

## How to Test

### 1. Start the Server

```bash
npm run dev:server
```

Server will start on **port 3003** with:
- WebSocket server listening
- World "world" loaded/created
- Normal terrain generator active
- Chunk system ready

### 2. Start the Client

```bash
npm run dev:client
```

Client will open on **http://localhost:3001** with main menu.

### 3. Connect to Server

In the main menu:
1. Server Name: `My Server` (or any name)
2. Server Address: `localhost`
3. Server Port: `3003`
4. Click **"Connect to Server"**

### 4. What Should Happen

**Expected behavior:**
1. **Connection**: WebSocket connects to server
2. **Chunk Requests**: Client requests 49 chunks (7x7 grid around spawn at 0,0)
3. **Server Response**: Server generates/loads chunks and sends data
4. **Rendering**: ChunkRenderer creates meshes for each chunk
5. **Display**: Chunks appear in the scene as terrain

**Console output (Client):**
```
[Client] Connecting to server: {name: "My Server", address: "localhost", port: 3003}
[Client] Connecting to ws://localhost:3003...
[WebSocket] Connecting to ws://localhost:3003
[WebSocket] Connected
[Client] Connected successfully
[ChunkManager] Requesting chunks around 0,0 (radius 3)
[ChunkManager] Requesting chunk -3,-3
[ChunkManager] Requesting chunk -3,-2
...
[ChunkManager] Received chunk -3,-3 (32768 blocks)
[ChunkManager] Rendered chunk -3,-3
...
```

**Console output (Server):**
```
[Server] Client connected
[Server] Chunk request: -3,-3
[World:world] Generating chunk (-3,-3) with normal generator
[Server] Sent chunk -3,-3 to client
...
```

### 5. Camera Controls

Once connected:
- **WASD**: Move camera (not yet player movement)
- **Mouse**: Look around
- **Camera Speed**: 0.5 units/sec
- **Camera Position**: Starts at (0, 80, 0) looking towards (10, 79, 10)

## Current Implementation Details

### ChunkRenderer

**Rendering approach:**
- Simple cube-per-block (no optimization yet)
- Each non-air block = 1 cube with 6 faces
- 24 vertices per cube (4 per face × 6 faces)
- Texture: `/textures/stone.png` (fallback to gray color)

**Performance:**
- A fully solid 32×256×32 chunk = 262,144 blocks
- Each block = 24 vertices, 12 triangles
- One chunk could generate ~6M vertices (not optimized!)

**Known issues:**
- ❌ No face culling (renders all 6 faces even if hidden)
- ❌ No greedy meshing (combines adjacent faces)
- ❌ Renders all Y layers (should skip empty layers)
- ✅ Skips air blocks (blockId === 0)

### ChunkManager

**Chunk loading:**
- Requests chunks in radius around position
- Default radius: 3 (7×7 grid = 49 chunks)
- Caches loaded chunks
- Listens for two message types:
  - `chunk_data` (new JSON format)
  - `WorldChunkLoad` (old protobuf format)

### WebSocketClient

**Communication:**
- JSON messages (protobuf planned)
- Message format: `{ type: "...", ...data }`
- Event-based handlers
- Auto-reconnect: Not implemented yet

## Expected Visual Result

You should see:
- **Terrain**: Hilly landscape with simplex noise
- **Height variation**: Base height ~64, variation ~40 blocks
- **Grass/Dirt layers**: Top blocks should be grass, below dirt, below stone
- **Sky**: Light blue (0.5, 0.7, 1.0)
- **Lighting**: Hemispheric light from above

## Troubleshooting

### "Failed to connect to server"

Check:
1. Server is running on port 3003
2. No firewall blocking WebSocket
3. Server console shows "Server started on port 3003"

### "No chunks visible"

Check browser console for:
1. "Connected successfully" - WebSocket connected
2. "Requesting chunk X,Z" - Chunks requested
3. "Received chunk X,Z" - Chunks received
4. "Rendered chunk X,Z" - Meshes created

Check server console for:
1. "Client connected" - Client connected
2. "Chunk request: X,Z" - Received requests
3. "Generating/Loading chunk" - Processing chunks
4. "Sent chunk X,Z" - Sent data

### "Chunks appear but are invisible"

Possible causes:
1. Material not loaded (check `/textures/stone.png` exists)
2. Camera inside solid geometry
3. Normals inverted
4. Mesh culled (check camera position)

### Performance Issues

Current implementation is NOT optimized:
- Each chunk can generate millions of vertices
- Browser may freeze during chunk generation
- FPS will drop with many chunks loaded

**Solutions (to be implemented):**
1. Face culling (skip hidden faces)
2. Greedy meshing (combine adjacent faces)
3. LOD (Level of Detail for distant chunks)
4. Web Workers (offload mesh generation)

## Next Steps

### Phase 1: Fix Rendering Performance
- Implement face culling
- Skip empty Y layers
- Add chunk height detection

### Phase 2: Implement Greedy Meshing
- Combine adjacent block faces
- Reduce vertex count by ~80%

### Phase 3: Player Controls
- Migrate player controls from old voxelsrv
- Replace camera with player entity
- Implement collision detection
- Add gravity and jumping

### Phase 4: GUI
- HUD (crosshair, health, hotbar)
- Chat system
- Inventory UI
- Debug info (F3)

## Port Configuration

**Current setup:**
- Client (Vite): http://localhost:3001
- Server (WebSocket): ws://localhost:3003

**Note:** Vite tried port 3000 but it was in use, so it moved to 3001. Server was moved to 3003 to avoid conflicts.

## File Structure

```
packages/client/src/
├── VoxelClient.ts           # Main client, now with WebSocket integration
├── network/
│   └── WebSocketClient.ts   # WebSocket connection handler
├── world/
│   └── ChunkManager.ts      # Chunk loading and caching
├── rendering/
│   └── ChunkRenderer.ts     # Mesh generation from chunk data
└── gui/
    └── MainMenu.ts          # Server selection UI
```

## Testing Checklist

- [ ] Server starts without errors
- [ ] Client loads main menu
- [ ] Connection succeeds
- [ ] Client requests chunks (check console)
- [ ] Server sends chunks (check console)
- [ ] Chunks render in scene
- [ ] Camera can move around
- [ ] Chunks are visible from different angles
- [ ] No browser console errors
- [ ] Performance is acceptable (>30 FPS with few chunks)

## Known Limitations

1. **No chunk unloading**: Memory usage grows with distance traveled
2. **No chunk updates**: Block changes not synchronized
3. **No entities**: Players/mobs not rendered
4. **No player physics**: Camera flies through blocks
5. **No textures per block**: All blocks use same texture
6. **No biomes**: Terrain is uniform
7. **No lighting**: Blocks are evenly lit
8. **No shadows**: No shadow mapping
9. **No sky**: Just clear color
10. **No GUI**: Just main menu, no HUD yet
