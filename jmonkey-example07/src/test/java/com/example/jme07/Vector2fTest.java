package com.example.jme07;

import com.jme3.math.Vector2f;

import java.util.HashMap;

public class Vector2fTest {

    public static void main(String[] args) {
        System.out.println("Vector2fTest");

        HashMap<Vector2f, String> map = new HashMap<>();
        map.put(new Vector2f(1, 2), "1,2");
        map.put(new Vector2f(1, 3), "1,3");
        map.put(new Vector2f(2, 3), "2,3");

        System.out.println(map.get(new Vector2f(1, 2)));
        System.out.println(map.get(new Vector2f(1, 3)));
        System.out.println(map.get(new Vector2f(2, 3)));


    }
}
