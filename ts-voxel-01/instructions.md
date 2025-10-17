# Voxelsrv

https://github.com/VoxelSrv/voxelsrv.git
https://github.com/VoxelSrv/voxelsrv-server-old.git

## Setup

In `ts-voxel-01` soll ein TypeScript projekt erstellt werden. Das projekt
soll eine 3D-Welt darstellen.
Im Ordner `ts-voxel-01/tmp` sind die beiden alten Projekte `voxelsrv` (3D Ansicht) und `voxelsrv-server` (Server Daten)
enthalten. voxelsrv kann mit voxelsrv-server als Backend oder included im Frontend laufen. Beide Projekte enthalten 
alte dependencies, die teilweise nicht mehr genutzt werden koennen. 
- Lege eine neue Projektstruktur in `ts-voxel-01` an.
- Analysiere `ts-voxel-01/tmp/voxelsrv` und `ts-voxel-01/tmp/voxelsrv-server`
- Welche neuen Versionen der dependencies sind in den beiden Projekten enthalten?
- Welche Dependencies muessen durch neue Technologie ausgetauscht werden?
- Erstelle in `ts-voxel-01` eine neue Version des Projekts. Der Server kann gleich als Demo enthalten bleiben,
  damit das Frontent standalone nutzbar bleibt, später soll ein anderer Server verwendet werden der dann die 
  gRPC-Schnittstelle nutzt.

```text
 Zusammenfassung

  Ich habe erfolgreich ein modernes TypeScript-Voxel-Projekt in ts-voxel-01 erstellt. Hier ist die Übersicht:

  📁 Projektstruktur

  ts-voxel-01/
  ├── packages/
  │   ├── client/          # 3D-Frontend (BabylonJS + Vite)
  │   ├── server/          # WebSocket-Server (Demo)
  │   ├── protocol/        # Shared WebSocket Protocol
  │   └── core/            # Shared Types & Utils
  ├── package.json         # Workspace Root
  ├── tsconfig.base.json   # Base TypeScript Config
  └── README.md           # Dokumentation

  🔄 Dependencies-Analyse

  Hauptupdates:

  | Package    | Alt → Neu            | Änderung         |
  |------------|----------------------|------------------|
  | BabylonJS  | 5.0.0-alpha → 8.32.0 | Stabile Version  |
  | TypeScript | 4.2.3 → 5.9.3        | Moderne Features |
  | Webpack    | 4.46.0 → Vite 7.1.10 | Komplett ersetzt |
  | ws         | 7.4.4 → 8.18.3       | Update           |

  Entfernt/Ersetzt:
  - ❌ webpack + webpack-dev-server → ✅ Vite (viel schneller)
  - ❌ threads → ✅ Native Web Workers (falls benötigt)
  - ❌ node-fetch → ✅ Native fetch (Node >=18)
  - ❌ noa-engine → ✅ Direktes BabylonJS

  ✨ Features

  Implementiert:
  - ✅ 3D-Voxel-Rendering mit BabylonJS
  - ✅ Terrain-Generierung (Simplex Noise)
  - ✅ WebSocket Client-Server Kommunikation
  - ✅ First-Person Controls (WASD + Maus)
  - ✅ Chunk-basiertes World Management
  - ✅ Debug UI (FPS, Position, Chunks)

  Projektaufbau:
  - TypeScript Project References für Type-Safety
  - npm Workspaces für Monorepo
  - ESM-only (keine CommonJS mehr)
  - Moderne async/await Patterns

  🚀 Nächste Schritte

  Um das Projekt zu starten:

  cd ts-voxel-01

  # Dependencies installieren
  npm install

  # Server starten (Terminal 1)
  npm run dev:server

  # Client starten (Terminal 2)  
  npm run dev

  Der Server läuft dann embedded im Frontend als Demo. Später kann ein separater gRPC-Server verwendet werden.

  📋 Verbleibende Aufgaben

  Für ein vollständiges Spiel fehlen noch:
  1. Block Break/Place mit Raycast
  2. Multiplayer (andere Spieler sichtbar)
  3. Texture-Mapping
  4. Collision Detection
  5. Chat-System
  6. Inventar
  7. gRPC-Backend Integration

  Die gesamte Analyse und Empfehlungen sind in der README.md dokumentiert!
```
