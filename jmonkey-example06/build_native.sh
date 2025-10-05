#!/bin/bash

echo "=== Building jMonkey Example 06 Native Image ==="

# Kompiliere das Projekt
echo "Kompiliere Java-Code..."
mvn clean compile

if [ $? -ne 0 ]; then
    echo "Fehler beim Kompilieren!"
    exit 1
fi

# Erstelle das Native Image
echo "Erstelle Native Image..."
mvn native:compile

if [ $? -eq 0 ]; then
    echo "Native Image erfolgreich erstellt: ./jmonkey-example06-native"
    echo "Ausführen mit: ./jmonkey-example06-native"
else
    echo "Fehler beim Erstellen des Native Images!"
    exit 1
fi
