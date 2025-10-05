#!/bin/bash
cd "$(dirname "$0")"

# Kompiliere das Projekt
mvn clean compile

# Baue Classpath
CP=$(mvn dependency:build-classpath -Dmdep.outputFile=/dev/stdout -q)

# Starte Anwendung mit macOS-spezifischer JVM-Option
java -XstartOnFirstThread -cp "target/classes:$CP" com.example.jme07.Example07Main > target/log.txt 2>&1
