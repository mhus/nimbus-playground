# Babylon.js TypeScript Isometrische Gitterstruktur mit Pfeiltasten-Steuerung

Eine 3D-Web-Applikation mit Babylon.js 8.0 und TypeScript, die eine scrollbare isometrische Gitterstruktur darstellt.

## Features

- Isometrische Kamera-Perspektive (fixe Sicht)
- Scrollbares Gitterraster mit Pfeiltasten-Steuerung
- Unendliches Gitter durch nahtlose Textur-Wiederholung
- Prozedural generierte Gitter-Textur
- TypeScript für typsichere Entwicklung
- Webpack-basiertes Build-System

## Installation

```bash
npm install
```

## Entwicklung

Starte den Development-Server:

```bash
npm run dev
```

Die Anwendung wird auf http://localhost:3001 geöffnet.

## Build

Erstelle eine Production-Build:

```bash
npm run build
```

Die Ausgabe befindet sich im `dist/` Verzeichnis.

## Steuerung

- **↑ Pfeil nach oben**: Diagonal nach links-unten bewegen (isometrisch)
- **↓ Pfeil nach unten**: Diagonal nach rechts-oben bewegen (isometrisch)
- **← Pfeil nach links**: Diagonal nach links-oben bewegen (isometrisch)
- **→ Pfeil nach rechts**: Diagonal nach rechts-unten bewegen (isometrisch)

Die Kamera bleibt dabei fixiert - nur das Gitterraster bewegt sich!
Die Bewegungsrichtungen sind an die isometrische Perspektive angepasst für natürlichere Navigation.

## Konfiguration

Im Code können verschiedene Parameter angepasst werden:

### Kamera-Einstellungen:
```typescript
const CAMERA_DISTANCE = 15;     // Entfernung der Kamera
const CAMERA_HEIGHT = 8;        // Höhe der Kamera (flacher)
const CAMERA_ANGLE = 30;        // Winkel in Grad
```

### Bewegungs-Einstellungen:
```typescript
private moveSpeed: number = 0.01; // Geschwindigkeit der Gitterbewegung
```

### Gitter-Einstellungen:
```typescript
const TILE_REPEAT = 5;          // Anzahl der Kachel-Wiederholungen
const GRID_DIVISIONS = 4;       // Anzahl Gitterlinien pro Kachel
```

## Szenen-Details

- **Fixe isometrische Kamera**: Position und Winkel konfigurierbar
- **Scrollbares Gitter**: Unendliche Bewegung durch Textur-Offsets
- **Nahtlose Wiederholung**: Wrap-Around-Effekt für kontinuierliches Gitter
- **Gitter-Ebene**: 20x20 Einheiten große Ebene mit konfigurierbaren Kacheln
- **Beleuchtung**: Hemisphärisches Licht für gleichmäßige Ausleuchtung

## Projektstruktur

- `src/index.ts` - Haupt-TypeScript-Datei mit scrollbarer isometrischer Szene
- `src/index.html` - HTML-Template
- `webpack.config.js` - Webpack-Konfiguration
- `tsconfig.json` - TypeScript-Konfiguration
