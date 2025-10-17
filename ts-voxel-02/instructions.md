# Voxelsrv

https://github.com/VoxelSrv/voxelsrv.git
https://github.com/VoxelSrv/voxelsrv-server-old.git

## Setup

In `ts-voxel-02` soll ein TypeScript projekt erstellt werden. Das projekt
soll eine 3D-Welt darstellen.
Im Ordner `ts-voxel-02/tmp` sind die beiden alten Projekte `voxelsrv` (3D Ansicht) und `voxelsrv-server` (Server Daten)
enthalten. voxelsrv kann mit voxelsrv-server als Backend oder included im Frontend laufen. Beide Projekte enthalten 
alte dependencies, die teilweise nicht mehr genutzt werden koennen.

Du kannst schritt fuer schritt die anwendung migrieren:
- Lege eine neue Projektstruktur in `ts-voxel-02` an.
- Analysiere `ts-voxel-02/tmp/voxelsrv` und `ts-voxel-02/tmp/voxelsrv-server`
- Welche neuen Versionen der dependencies sind in den beiden Projekten enthalten?
- Welche Dependencies muessen durch neue Technologie ausgetauscht werden?
- Erstelle in `ts-voxel-02` eine neue Version des Projekts. Der Server kann gleich als Demo enthalten bleiben,
  damit das Frontent standalone nutzbar bleibt, später soll ein anderer Server verwendet werden der dann die 
  gRPC-Schnittstelle nutzt. 
- Erstelle packages: client, core, server, protocol
- Übernehme alle model Strukturen von `ts-voxel-02/tmp/voxelsrv-server` wie z.B. 
  `ts-voxel-02/tmp/voxelsrv-server/src/lib/world/entity.ts` in core als model.
- Erstelle einen plan, wie schritt fuer schritt die gesammte Anwendung migriert werden soll.
- Fuehre den plan schritt fuer schritt aus

- Übernehme alle Controller/Manager
- Übernehme alle protobuf configurationen und sender und handler aus den projekten.
- Übernehme alle statischen dateien wie assets, texturen, sounds

```text
 Ich habe erfolgreich die komplette Migration von ts-voxel-02 durchgeführt! Hier ist eine Zusammenfassung:

  ---
  ✅ Was wurde umgesetzt:

  1. Projekt-Analyse & Struktur

  - Alte Projekte (voxelsrv, voxelsrv-server) vollständig analysiert
  - Monorepo mit 4 Packages erstellt (core, protocol, server, client)
  - Moderne Dependencies: TypeScript 5.7, Babylon.js 7.37, Protobuf 7.4

  2. Core Package (@voxel-02/core)

  - Types: XYZ, XZ, Vector3, Rotation
  - Helpers: Chunk-Koordinaten-Transformation, Seeds
  - Models: Entity, World, Chunk, Block, Item, Inventory

  3. Protocol Package (@voxel-02/protocol)

  - Proto-Dateien kopiert: client.proto, server.proto, world.proto
  - Handler-Interfaces für Client/Server
  - Basis für Protobuf-Integration

  4. Server Package (@voxel-02/server) ⭐

  - Registry-System: Blocks, Items, Commands mit ID-Verwaltung
  - World-Manager: Multi-World-Support, Chunk-Cache, Auto-Save
  - World-Generatoren:
    - FlatWorldGenerator (flache Welt)
    - NormalWorldGenerator (Simplex-Noise-Terrain)
  - Entity-Manager: UUID-basiert, Position/Rotation, Tick-System
  - WebSocket-Server: Client-Verbindungen, Message-Handling

  5. Client Package (@voxel-02/client) ⭐

  - Babylon.js 7.x Integration
  - Scene mit FreeCamera (WASD-Steuerung)
  - Licht-System
  - Vite Dev-Server (sehr schnell!)
  - HTML/CSS mit Loading-Screen

  6. Assets 🎨

  - 1896 Dateien kopiert:
    - Texturen (Blöcke, Items, UI)
    - Audio (Sounds, Musik)
    - Fonts
    - 3D-Models

  ---
  📁 Dateien erstellt:

  Dokumentation

  - README.md - Projekt-Übersicht
  - MIGRATION_PLAN.md - Detaillierter Phasenplan
  - STATUS.md - Aktueller Projektstatus
  - QUICKSTART.md - Schnelleinstieg-Anleitung

  Code (~25 TypeScript-Dateien, ~2000 Zeilen)

  - Core: 5 Dateien
  - Protocol: 3 Dateien (+ Proto-Files)
  - Server: 8 Dateien
  - Client: 3 Dateien
  - Config: 9 package.json + tsconfig.json

  ---
  🚀 Wie starten:

  cd ts-voxel-02

  # Dependencies installieren
  npm install

  # Server starten (Port 3001)
  npm run dev:server

  # Client starten (Port 3000)
  npm run dev:client

  Server-Ausgabe:
  [Server] Server started on port 3001
  [Server] World: world (seed: 123456)
  [Server] Generator: normal

  Client: http://localhost:3000 (Babylon.js 3D-Scene)

  ---
  🎯 Nächste mögliche Schritte (optional):

  1. Client-Server-Verbindung: WebSocket-Integration
  2. Chunk-Rendering: Mesh-Generierung aus Chunk-Daten
  3. Player-System: Spawn, Inventar, Movement
  4. GUI: Menu, HUD, Chat, Inventar
  5. Multiplayer: Testing & Optimierung

  ---
  📊 Statistiken:

  - Packages: 4
  - TypeScript Files: ~25
  - Code Lines: ~2000
  - Assets: 1896
  - Dependencies: Alle auf neueste Versionen aktualisiert

  Von → Zu:
  - TypeScript 4.2 → 5.7
  - Webpack 4 → Vite
  - Babylon.js 5.0-alpha → 7.37 (stabil)
  - Protobuf 6.10 → 7.4
  - WebSocket 7.4 → 8.18

  ---
  Die Basis-Migration ist komplett abgeschlossen! Das Projekt ist jetzt eine moderne, erweiterbare Voxel-Engine mit sauberer Architektur. Alle weiteren Features können schrittweise hinzugefügt werden. 🎮
```
---
Der Client ist aber nicht so wie in `ts-voxel-02/tmp/voxelsrv`. Am Anfang fehlt z.b. das menu mit dem man sich einloggen 
und den server angeben kann.
---
Der client zeigt aber keine welt an. Es gibt nur eine leere szene mit einer kamera und licht.
---
Warum uebernimmst du das system nicht von `ts-voxel-02/tmp/voxelsrv`? Das ist was wir hier erreichen wollen. Die Migration des projektes.
---
Wenn ich in den bildschirm clicke soll der mauszeiger verschwinden und die steuerung ohne gehaltene taste funktionieren.
---
Es fehlt noch collision detection. Wenn ich auf einen Block stosse kann ich nicht weiter durch den Block 'gehen'.

Es soll einen unterscheidliche vortbewegungen geben. Bei Walking wird man durch gravitation auf den boden gezogen. Mit space kann man dann springen.
Mit der F Taste kann man zwischen flight und walk mode wechseln. Im Flight mode gibt es keine gravitation.
---
Um die Welt, Voxels und Texturen zu debuggen moechte ich, wenn ich wenn ich die Teste '\' druecke einen dump der Welt auf console ausgeben haben.
---
Nachladen von Welt-Dateien-Chunks: Es wird nicht immer alles geladen und angezeigt, da welten wesentlich größer als jetzt sein können. Deshalb macht es sinn chunks im hintergrund nachzuladen wenn man
sich bewegt.
---
Die selektierten zeilen sollen im Safari auf

private renderDistance = 3; // Chunks to load around player
private unloadDistance = 4; // Chunks further than this will be unloaded

und im google chrome auf

private renderDistance = 1; // Chunks to load around player
private unloadDistance = 2; // Chunks further than this will be unloaded

gesetzt werden.
---
Im Flugmodus fliegt man nicht mehr in Blickrichtung. Wenn der flugmodus aktiv ist, soll, wie es vorher war, in Blickrichtung geflugen werden.
---
Mit den Keys Q und W soll man sich nach Links und Rechts drehen können. Zusätzlich zur Mausbewegung.
---
Im Walk Modus, wenn man an einen Block stößt, soll man automatisch, maximal einen Block, nach oben rutschen. Springen soll zwei Bloecke hoch sein.
---
Im ursprünglichen Projekt werden auch blocks mit namen, nicht integer ids unterstuetzt. In 
`/ts-voxel-02/tmp/voxelsrv-server/src/default/blocks.ts` werden alle moeglichen Blocktypen definiert. Uebernehem die Konfiguration
in das package `@voxel-02/core` als EntryTypen. Uebernehem fehlende Attribute aus
`/ts-voxel-02/tmp/voxelsrv-server/src/lib/registry.ts' Block in EntryType.
Fuege die Daten sinnvoll hinzu damit server und client die Typen benutzen koennen und das das system flexibel bleibt.
Pruefe die Option, das der Server die Blocktypen/EntityTypen dynamisch ausliefern kann, anstelle von statischen Konfigurationen im Client.
Auch die Generatoren sollen die Typen geim generieren nutzen.

```text
 Für weitere Verbesserungen könnten Sie:
  - Texture-Atlas-System für Block-Rendering
  - Block-Metadata-System für Rotationen/Zustände
  - Client-seitiges Caching der Registry
  - Kompressionfür Registry-Sync (Protobuf/MessagePack)
```
---
> Wenn du auch die assets, also texturen, modelle, sounds durch den server ausliefern kannst, verschiebe diese dateien vom 
client in den server und passe server und client an.
---
