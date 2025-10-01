
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