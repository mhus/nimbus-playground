
# 01 

Mit Babylon.js 8.0 und TypeScript eine 3D-Web-Applikation.

# 02

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

Die tiles sind isometrisch und können auf die Kacheln
als Textur gelegt werden.

# 03 Tile provider

Was auf einer Kachen angezeigt werden soll, soll aus einem
TileProvider gelesen werden. Der TileProvider hat erstmal 
alle Daten in einem zweidimensionalen Array. Die daten werden
beim Start generiert. Die Ausdehnung des Arrays ist konfigurierbar
in einer constante.

Für jede Kachel (Tile) wird eine Struktur zurückgegeben in der ein Array
von 'Level' enthalten ist. Aktuell ist nur kein oder ein Level im Array.
Ein Level hat eine level und eine texture.

Beispiel:

getTile(x,y) : Tile

Tile {
    levels: [
        {
            level: 0,
            texture: 'grass'
        },
        {
            level: 1,
            texture: 'water'
        }
    ]
}




# 04 Texturen zu isometrisch verzogenen Boxen

Das Erstellen einer Kachel wird komplexer als gedacht.
Deshalb soll das Zeichnen der Kacheln in einer separaten
Methode erfolgen. Der Methode wird das Tile objekt,
die Coordinaten der Kachel und ctx übergeben. 


# 05 Reorganisieren der Kacheln

Das Zeichnen der Kacheln muss komplett anders gemacht werden.
Es soll ein sehr grosses terrain dargestellt werden und die
Kacheln sind immer nur ein Ausschnitt aus dem grossen terrain.

das bedeutet die Kacheln koennen nicht am anfang einmal gezeichnet werden,
sonden müssen, je nachdem was die Kachel gerade zeigen muss, neu gezeichnet 
werden. Selbst wenn die Kacheln bereits gezeichnet wurden, kann sich die 
Darstellung ändern (z.B. wird der Inhalt durchsichtiger oder ein Tor geht auf).

Also die sichtbaren kacheln sind eine Projektion auf eine grosse Fläche, besitzen
also einen lokalen index und einen globalen index.

Da sich kacheln überlagern können, müssen die kacheln von oben nach unten
gezeichnet werden.

# Spaeter

Da tiles dargestellt werden sollen, muessen die Kacheln
als Boxen dargestellt werden die gestapelt, bzw. auf verschiedenen
Leveln stehen.

Die Boxen benoetigen durch die isometrische Darstellung zwei seiten
wenn die Kacheln auf dem gleichen Level stehen werden die seiten
verdeckt.

Die anzahl der level noch oben oder unten ist nicht festgelegt. Die
aktuelle darstellung ist das level 0. Die höhe eines levels ist aber
fest und soll in einer constante sein. Welche level mit welchen
texturen es gibt, muss durch eine Struktur 





