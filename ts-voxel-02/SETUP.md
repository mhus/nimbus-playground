# Setup-Anleitung - ts-voxel-02

## Erstmaliges Setup

Nach dem Checkout oder nach Code-Änderungen:

### 1. Dependencies installieren

```bash
npm install
```

### 2. Core & Protocol Packages bauen

Die Packages `core` und `protocol` müssen vor dem Server/Client gebaut werden:

```bash
npm run build:deps
```

Dies baut:
- `@voxel-02/core` → `packages/core/dist/`
- `@voxel-02/protocol` → `packages/protocol/dist/`

### 3. Server starten

```bash
npm run dev:server
```

Ausgabe:
```
[WorldManager] Registered generator: flat
[WorldManager] Registered generator: normal
[Server] Starting VoxelSrv server...
[Registry] Finalized 4 blocks, 3 items, 0 commands
[World:world] Initialized
[Server] Server started on port 3001
[Server] World: world (seed: 480811)
[Server] Generator: normal
```

### 4. Client starten (optional)

```bash
npm run dev:client
```

Client läuft auf: http://localhost:3000

## Bei Code-Änderungen

### Änderungen in Core oder Protocol

```bash
npm run build:deps
```

Dann Server neu starten.

### Änderungen im Server

Server wird automatisch neu geladen (tsx watch).

### Änderungen im Client

Client wird automatisch neu geladen (Vite HMR).

## Troubleshooting

### "Cannot find module '@voxel-02/core'"

```bash
npm run build:deps
```

### "tsx: command not found"

```bash
npm install
```

### Port 3001 schon belegt

Server-Port in `packages/server/src/index.ts` ändern:

```typescript
const server = new VoxelServer({
  port: 3002,  // <-- Anderen Port
  // ...
});
```

## Dateistruktur nach Build

```
ts-voxel-02/
├── packages/
│   ├── core/
│   │   └── dist/              ✅ Nach build:deps
│   ├── protocol/
│   │   └── dist/              ✅ Nach build:deps
│   ├── server/
│   │   └── dist/              (optional, für Production)
│   └── client/
│       └── dist/              (optional, für Production)
└── worlds/
    ├── blocks.json            ✅ Wird automatisch erstellt
    └── world/
        ├── world.json         ✅ Wird automatisch erstellt
        └── chunks/            ✅ Chunks werden hier gespeichert
            ├── 0,0.chk
            └── ...
```

## Quick Commands

```bash
# Alles neu aufsetzen
npm run clean
npm install
npm run build:deps

# Server starten
npm run dev:server

# Client starten
npm run dev:client

# Production Build (alle Packages)
npm run build
```

## Nächste Schritte

Siehe [QUICKSTART.md](./QUICKSTART.md) für Details zur Nutzung.
