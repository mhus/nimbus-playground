# Voxel Server

WebSocket-Server für die Voxel-Welt mit World-Persistence.

## Features

- ✅ WebSocket-basierte Kommunikation
- ✅ World-Persistence (Speichern/Laden)
- ✅ Zwei Generator-Typen: Flat & Normal (Hilly)
- ✅ Automatisches Speichern (alle 30 Sekunden)
- ✅ Chunk-basiertes World-Management

## World-Persistence

### Verzeichnisstruktur

```
packages/server/tmp/world/
├── world.json          # World-Metadaten
└── chunks/             # Gespeicherte Chunks
    ├── 0,0.chk
    ├── 1,0.chk
    └── ...
```

### World-Metadaten (world.json)

```json
{
  "name": "world",
  "seed": 1760690490945,
  "generator": "flat",
  "version": 2,
  "createdAt": 1760690490946,
  "chunkSize": 32,
  "worldSize": 256
}
```

**Felder:**
- `name`: World-Name (immer "world")
- `seed`: Generierungs-Seed
- `generator`: Generator-Typ ("flat" oder "normal")
- `version`: Format-Version (aktuell 2)
- `createdAt`: Erstellungs-Timestamp
- `chunkSize`: Chunk-Größe (Standard: 32)
- `worldSize`: Welt-Höhe (Standard: 256)

### Verhalten

1. **Erster Start**:
   - Server prüft `tmp/world/world.json`
   - Wenn nicht vorhanden: Neue Welt generieren
   - Generator-Typ wird zufällig gewählt (flat oder normal)
   - Seed wird mit `Date.now()` generiert

2. **Folgender Start**:
   - Server lädt `tmp/world/world.json`
   - Verwendet gespeicherten Seed und Generator-Typ
   - Welt bleibt konsistent

3. **Chunk-Verwaltung**:
   - Chunks werden bei Bedarf generiert
   - Modifizierte Chunks werden alle 30 Sekunden gespeichert
   - Beim Shutdown werden alle Chunks gespeichert

## Generator-Typen

### Flat Generator
- Flache Welt mit Schichten
- Grass Level: Y=50
- Dirt: Y=45-49
- Stone: Y=0-44

### Normal Generator
- Hügelige Landschaft
- Simplex-Noise-basiert
- Höhenbereich: Y=32-96

## Development

```bash
npm run dev    # Mit tsx watch
npm run build  # TypeScript kompilieren
npm start      # Production (dist/index.js)
```

## Umgebungsvariablen

- `PORT`: WebSocket-Port (default: 3000)

## API

Der Server kommuniziert über WebSocket mit dem Protocol-Paket (`@voxel/protocol`).

### Client → Server

- `JOIN`: Spieler tritt bei
- `MOVE`: Position-Update
- `BLOCK_BREAK`: Block abbauen
- `BLOCK_PLACE`: Block platzieren
- `CHAT`: Chat-Nachricht

### Server → Client

- `WORLD_DATA`: World-Informationen
- `CHUNK_DATA`: Chunk-Daten
- `PLAYER_JOINED`: Neuer Spieler
- `PLAYER_LEFT`: Spieler verlassen
- `PLAYER_MOVED`: Spieler bewegt
- `BLOCK_UPDATE`: Block geändert
- `CHAT_MESSAGE`: Chat-Nachricht

## Welt zurücksetzen

Um eine neue Welt zu generieren:

```bash
rm -rf packages/server/tmp/world
```

Beim nächsten Start wird eine neue Welt generiert.
