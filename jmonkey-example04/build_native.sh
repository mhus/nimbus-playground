#!/bin/bash

# Native Build Script für jmonkey-example04 (Standalone jMonkey Engine)
# Kompiliert die Anwendung zu einem nativen Executable mit GraalVM Native Image

set -e  # Exit on error

cd $(dirname "$0")

echo "=== Native Build für jmonkey-example04 (Standalone) ==="

# Prüfe ob Java 25 verfügbar ist
echo "🔍 Prüfe Java Version..."
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" != "25" ]; then
    echo "⚠️  Aktuelle Java Version: $JAVA_VERSION"
    echo "💡 Empfohlen: Java 25 für optimale Performance"
    echo "   Du kannst trotzdem fortfahren oder Java 25 installieren"
    echo "   Installation mit SDKMAN: sdk install java 25-graal"
    read -p "Fortfahren? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Java 25 gefunden"
fi

# Prüfe ob GraalVM installiert ist
if ! command -v native-image &> /dev/null; then
    echo "❌ GraalVM Native Image ist nicht installiert!"
    echo "Installation:"
    echo "1. Installiere GraalVM: https://www.graalvm.org/downloads/"
    echo "2. Oder mit SDKMAN: sdk install java 21.0.1-graal"
    echo "3. Installiere Native Image: gu install native-image"
    exit 1
fi

echo "✅ GraalVM Native Image gefunden"

# Projekt-Verzeichnis
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "📁 Arbeitsverzeichnis: $PROJECT_DIR"

# Prüfe ob pom.xml vorhanden ist
if [ ! -f "pom.xml" ]; then
    echo "❌ pom.xml nicht gefunden"
    exit 1
fi

echo "✅ Maven-Projekt gefunden"

# Maven Clean
echo "🧹 Bereinige Projekt..."
mvn clean -q

# Native Compilation mit Maven
echo "🔨 Starte Native Compilation..."
echo "⚠️  Dies kann 5-15 Minuten dauern je nach Systemleistung..."
echo "⚠️  Während der Compilation wird viel Speicher benötigt (4-8 GB RAM)"

# Führe Native Build mit Profile aus
echo "📦 Kompiliere zu nativem Executable..."
mvn -Pnative native:compile -q

# Prüfe ob natives Executable erstellt wurde
NATIVE_EXECUTABLE="target/jmonkey-example04"
if [ -f "$NATIVE_EXECUTABLE" ]; then
    echo "✅ Natives Executable erfolgreich erstellt: $NATIVE_EXECUTABLE"

    # Kopiere zu Projektroot für einfacheren Zugriff
    cp "$NATIVE_EXECUTABLE" "./jmonkey-example04-native"

    # Zeige Dateigröße
    SIZE=$(du -h "./jmonkey-example04-native" | cut -f1)
    echo "📏 Dateigröße: $SIZE"

    # Mache ausführbar
    chmod +x "./jmonkey-example04-native"
    echo "✅ Executable-Berechtigung gesetzt"

    echo ""
    echo "🚀 Native Build abgeschlossen!"
    echo "Starte mit: ./jmonkey-example04-native"
    echo ""
    echo "💡 Tipps:"
    echo "  - Startzeit sollte unter 1 Sekunde sein"
    echo "  - Speicherverbrauch ist deutlich reduziert"
    echo "  - Keine JVM erforderlich zum Ausführen"
    echo "  - 3D-Terrain wird sofort geladen"

else
    echo "❌ Natives Executable konnte nicht erstellt werden"
    echo "🔍 Prüfe target/ Verzeichnis für Details:"
    ls -la target/ 2>/dev/null || echo "Target-Verzeichnis nicht gefunden"

    echo ""
    echo "🔧 Mögliche Lösungen:"
    echo "  1. Prüfe ob genügend RAM verfügbar ist (min. 4 GB)"
    echo "  2. Prüfe GraalVM Version: native-image --version"
    echo "  3. Führe mit mehr Speicher aus: export MAVEN_OPTS='-Xmx8g'"
    echo "  4. Prüfe Build-Log für detaillierte Fehlermeldungen"
    exit 1
fi
