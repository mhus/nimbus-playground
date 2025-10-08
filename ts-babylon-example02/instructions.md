Mit Babylon.js 8.0 und TypeScript eine 3D-Web-Applikation.

Es soll eine isometrische gitter raster struktur zu
sehen sein, die aus einer Ebene mit einem
Kachel-Material besteht. Auf der Ebene soll
eine Kamera positioniert sein, die die Szene
aus einer isometrischen Perspektive zeigt.

Mit den Pfeiltasten bewegt sich das Gitter raster.
Dabei soll die Kamera fixiert bleiben. Je nach
Bewegungsrichtung sollen an den Enden neue Kacheln
angezeigt werden bzw. verschwinden. 

Die Fläche an den Rändern der soll sich 'auflösen',
damit der Übergang schöner ist.

Im Ordner assets ist eine Datei tiles-textures.png
diese Datei muss in das Verzeichnis assets kopiert 
werden. Sie enthält 12 tiles die als Material verwendet
werden. Sortiert von links nach rechts und dann von oben nach unten:
1. grass
2. grass mit gassbüscheln
3. links dirt, rechts grass
4. links grass, rechts dirt
5. unten dirt, oben grass
6. spitze oben rechts dirt, rest grass
7. spitze unten links grass, rest dirt
8. spitze oben links grass, rest dirt
9. wasser
10. dirt
11. dirt mit steichen
12. grass mit box

Die tiles sind isometrisch und können auf die Kacheln
als Textur gelegt werden.





