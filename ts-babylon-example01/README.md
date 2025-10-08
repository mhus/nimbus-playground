# Babylon.js TypeScript Hello World

Eine einfache 3D-Web-Applikation mit Babylon.js 8.0 und TypeScript.

## Features

- 3D-Szene mit einer rotierenden Box
- Interaktive Kamera-Steuerung
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

- **Maus ziehen**: Kamera um die Szene rotieren
- **Mausrad**: Zoom in/out
- **Rechte Maustaste + ziehen**: Kamera verschieben

## Projektstruktur

- `src/index.ts` - Haupt-TypeScript-Datei mit der Babylon.js-Logik
- `src/index.html` - HTML-Template
- `webpack.config.js` - Webpack-Konfiguration
- `tsconfig.json` - TypeScript-Konfiguration
