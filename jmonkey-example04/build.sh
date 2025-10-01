#!/bin/bash

# Build und Run Script für jmonkey-example04 (Standalone)
# Kompiliert und startet die jMonkey Engine Anwendung ohne Spring Boot

set -e  # Exit on error

echo "=== jMonkey Engine Standalone Build für jmonkey-example04 ==="

# Projekt-Verzeichnis
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "📁 Arbeitsverzeichnis: $PROJECT_DIR"

# Maven Clean & Compile
echo "🧹 Bereinige und kompiliere Projekt..."
mvn clean compile

# Package JAR mit Abhängigkeiten
echo "📦 Erstelle ausführbares JAR..."
mvn package

# Prüfe ob JAR existiert
JAR_FILE="target/jmonkey-example04-1.0.0-SNAPSHOT-jar-with-dependencies.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo "❌ JAR-Datei nicht gefunden: $JAR_FILE"
    echo "Verfügbare JARs:"
    ls -la target/*.jar 2>/dev/null || echo "Keine JAR-Dateien gefunden"
    exit 1
fi

echo "✅ JAR erstellt: $JAR_FILE"

# Zeige Dateigröße
SIZE=$(du -h "$JAR_FILE" | cut -f1)
echo "📏 JAR-Größe: $SIZE"

echo ""
echo "🚀 Build abgeschlossen!"
echo ""
echo "Starten mit:"
echo "  java -XstartOnFirstThread -jar $JAR_FILE"
echo ""
echo "Oder für einfacheres Starten:"
echo "  mvn exec:java"
