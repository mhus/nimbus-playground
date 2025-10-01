
# jMonkey Examles

## 01 - Hello World

```text
Im modul `jmonkey-example01` soll ein einfaches "Hello World" Beispiel mit jMonkeyEngine erstellt werden.
```

## 02 - More

```text
Erstelle im modul `jmonkey-example01`.

Erstelle in Java mit jMonkeyEngine ein minimales Beispiel für eine Tile-basierte Welt mit mehreren Stockwerken. 
- Verwende einfache Quads oder Box-Geometrien als Tiles (z. B. Boden). 
- Lege zwei Stockwerke (z=0 und z=1) an, jeweils in einem eigenen Node (floor0, floor1). 
- Platziere den Spieler als einfachen Würfel, der sich mit WASD bewegen lässt. 
- Baue eine Treppe bei (x=2, y=2) im Erdgeschoss ein, die beim Betreten den Spieler auf Stockwerk 1 teleportiert. 
- Beim Wechsel des Stockwerks soll nur das aktuelle Stockwerk sichtbar bleiben. 
  Nutze dafür `setCullHint(Spatial.CullHint.Always)` zum Ausblenden und `setCullHint(Spatial.CullHint.Inherit)` zum Einblenden. 
- Füge einfache Kollisionsabfrage hinzu, sodass der Spieler nicht durch Wände laufen kann. 
- Kommentiere den Code gut, sodass klar wird, wie man weitere Stockwerke hinzufügen könnte.
```

### 03 jmonkey und spring boot

```text
Erstelle in `jmonkey-example02` ein jmonkey hello world, das sich aber im spring boot framework
einreiht. Also mit einer Application main Klasse.

Achte darauf, das jmonkey im main thread laufen muss. Erstelle dazu einen JMonkeyManager, der
parallel zu Spring Boot ueber ein singleton erstellt wird. Und einen JMonkeyService, der den
JMonkeyManager verwendet.
```

### 04 jmonkey TileMap und spring boot

```text
Erstelle das modul `jmonkey-example03` mit vorlagen aus dem jmonkey-example02.

Die 3D app soll von einem TileProviderService die Tile map dynamisch laden und anzeigen.
```

### 05 jmonkey TileMap und spring boot fliessende Karte

```text
Erstelle das modul `jmonkey-example03` mit vorlagen aus dem jmonkey-example03.

In der tile map werden auch höhe der oberflache definiert. Die höhe ist für die
Ecke entscheidend. Damit ist die oberfläche fliessend.
```

```text
Ausgezeichnet! Das Projekt wurde erfolgreich kompiliert! 🎉
Ich habe das jmonkey-example03 Modul erfolgreich erweitert, um fließende Oberflächen zu implementieren. Die wichtigsten Änderungen:
🆕 Neue Funktionalität: Fließende Oberflächen
TileProviderService erweitert:
HeightPoint Klasse: Repräsentiert Eckpunkte mit spezifischen Höhen (x, y, height)
Erweiterte Tile Klasse: Jedes Tile hat jetzt 4 Eckpunkte mit individuellen Höhen:
SW (South-West), SE (South-East), NE (North-East), NW (North-West)
getHeightSW(), getHeightSE(), getHeightNE(), getHeightNW() Methoden
getAverageHeight() für Tile-Typ Bestimmung
Konsistente Höhenberechnung: getHeightAt(x, y) stellt sicher, dass benachbarte Tiles gleiche Höhen an gemeinsamen Eckpunkten haben
JMonkeyManager mit Custom Mesh-Generierung:
createTileMesh(): Generiert custom 3D-Meshes für jedes Tile basierend auf den 4 Eckpunkt-Höhen
8 Vertices pro Tile: 4 Boden-Vertices (Y=0) + 4 Oberflächen-Vertices (mit individuellen Höhen)
Triangulation: Jedes Tile besteht aus Dreiecken für Oberfläche, Seiten und Boden
Side-View Kamera: Optimiert für seitliche Betrachtung der fließenden Topographie
🌄 Ergebnis: Realistische Landschaft
Die neue Implementierung erstellt eine fließende, kontinuierliche Oberfläche anstatt einzelner Blöcke:
Wasserflächen (blau): Tiefe Bereiche mit sanften Übergängen
Sandstrände (gelblich): Erhöhte Ufer mit natürlichen Böschungen
Grasflächen (grün): Hügelige Landschaft mit organischen Formen
Erdgebiete (braun): Mittlere Erhebungen mit realistischen Hängen
Steinberge (grau): Hohe Gipfel mit dramatischen Höhenunterschieden
🔧 Technische Details:
Eckpunkt-basierte Höhen: Jede Tile-Ecke hat eine individuelle Höhe
Nahtlose Übergänge: Benachbarte Tiles teilen sich Eckpunkte für fließende Oberflächen
Custom Mesh-Generierung: Jedes Tile wird als individuelles 3D-Mesh gerendert
Deterministische Noise: Reproduzierbare Landschaftsgenerierung mit sanfteren Übergängen
Das System erstellt jetzt eine realistische 3D-Landschaft mit fließenden Höhenübergängen, die viel natürlicher aussieht als die ursprünglichen Block-basierten Tiles. Von der Side-View aus sind die sanften Hügel, Täler und Berge deutlich erkennbar! 🏔️
```
