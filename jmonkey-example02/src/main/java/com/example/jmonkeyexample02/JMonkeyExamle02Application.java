package com.example.jmonkeyexample02;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot Application Hauptklasse für jMonkey Engine Integration.
 *
 * Diese Klasse startet Spring Boot in einem separaten Thread und
 * jMonkey Engine im Main Thread (erforderlich für OpenGL auf macOS).
 */
@SpringBootApplication
public class JMonkeyExamle02Application {


    public static void main(String[] args) {

        // init JMonkeyManager vor Spring Boot starten
        JMonkeyManager.instance();

        // Spring Boot in einem separaten Thread starten

        Thread springBootThread = new Thread(() -> {
            SpringApplication.run(JMonkeyExamle02Application.class, args);
        });
        springBootThread.start();

        // Warten bis Spring Boot gestartet ist und JMonkey Manager verfügbar ist
        System.out.println("Warte auf Spring Boot Start...");
        while (!JMonkeyService.isSpringStarted()) {
            try {
                Thread.sleep(100); // Kurze Pause zwischen Prüfungen
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("Warten auf Spring Boot wurde unterbrochen!");
                return;
            }
        }
        System.out.println("Spring Boot ist gestartet!");

        // jMonkey Engine im Main Thread starten über statische instance() Methode
        JMonkeyManager jmonkeyManager = JMonkeyManager.instance();
        if (jmonkeyManager != null) {
            jmonkeyManager.start();
        } else {
            System.err.println("JMonkeyManager nicht verfügbar!");
        }
    }
}
