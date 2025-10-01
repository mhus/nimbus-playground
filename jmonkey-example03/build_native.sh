#!/bin/bash

# Native Build Script für jmonkey-example03 mit Spring Boot Native
# Kompiliert die Spring Boot Anwendung zu einem nativen Executable

set -e  # Exit on error

echo "=== Spring Boot Native Build für jmonkey-example03 ==="

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

# Prüfe ob Spring Boot Native Plugin vorhanden ist
echo "🔍 Prüfe Spring Boot Native Konfiguration..."
if ! grep -q "spring-boot-maven-plugin" pom.xml; then
    echo "❌ Spring Boot Maven Plugin nicht gefunden in pom.xml"
    exit 1
fi

echo "✅ Spring Boot Konfiguration gefunden"

# Maven Clean
echo "🧹 Bereinige Projekt..."
mvn clean -q

# Spring Boot Native Compilation
echo "🔨 Starte Spring Boot Native Compilation..."
echo "⚠️  Dies kann 5-15 Minuten dauern je nach Systemleistung..."
echo "⚠️  Während der Compilation wird viel Speicher benötigt (4-8 GB RAM)"

# Führe Spring Boot Native Build aus
echo "📦 Kompiliere zu nativem Executable..."
mvn -Pnative native:compile -q

# Prüfe ob natives Executable erstellt wurde
NATIVE_EXECUTABLE="target/jmonkey-example03"
if [ -f "$NATIVE_EXECUTABLE" ]; then
    echo "✅ Natives Executable erfolgreich erstellt: $NATIVE_EXECUTABLE"

    # Kopiere zu Projektroot für einfacheren Zugriff
    cp "$NATIVE_EXECUTABLE" "./jmonkey-example03-native"

    # Zeige Dateigröße
    SIZE=$(du -h "./jmonkey-example03-native" | cut -f1)
    echo "📏 Dateigröße: $SIZE"

    # Mache ausführbar
    chmod +x "./jmonkey-example03-native"
    echo "✅ Executable-Berechtigung gesetzt"

    echo ""
    echo "🚀 Spring Boot Native Build abgeschlossen!"
    echo "Starte mit: ./jmonkey-example03-native"
    echo ""
    echo "💡 Tipps:"
    echo "  - Startzeit sollte unter 1 Sekunde sein"
    echo "  - Speicherverbrauch ist deutlich reduziert"
    echo "  - Keine JVM erforderlich zum Ausführen"

else
    echo "❌ Natives Executable konnte nicht erstellt werden"
    echo "🔍 Prüfe target/ Verzeichnis für Details:"
    ls -la target/ 2>/dev/null || echo "Target-Verzeichnis nicht gefunden"
    exit 1
fi
