package com.example.jmonkeyexample02;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Service;

import java.lang.ref.Reference;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * JMonkey Service, der den JMonkeyManager verwendet.
 *
 * Dieser Service stellt eine Abstraktionsschicht zwischen Spring Boot
 * und der jMonkey Engine zur Verfügung.
 */
@Service
public class JMonkeyService implements ApplicationListener<ApplicationReadyEvent> {

    private static AtomicBoolean springStarted = new AtomicBoolean(false);
    private final JMonkeyManager jmonkeyManager;

    @Autowired
    public JMonkeyService() {
        this.jmonkeyManager = JMonkeyManager.instance();
    }

    public static boolean isSpringStarted() {
        return springStarted.get();
    }

    /**
     * Prüft, ob die Engine läuft.
     */
    public boolean isEngineRunning() {
        return jmonkeyManager.getApp() != null;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        springStarted.set(true);
    }
}
