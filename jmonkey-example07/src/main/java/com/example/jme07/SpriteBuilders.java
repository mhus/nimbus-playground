package com.example.jme07;

import com.jme3.math.Vector3f;
import java.util.Random;

/**
 * SpriteBuilders - Vordefinierte Builder für häufig verwendete Sprite-Typen
 */
public class SpriteBuilders {

    // Billboard Sprites
    public static Sprite createTreeSmall(Vector3f position, float scale, float rotation) {
        return new BillboardSprite(position, "Textures/Sprites/tree_small.png", 3f * scale, rotation, true);
    }

    public static Sprite createTreeLarge(Vector3f position, float scale, float rotation) {
        return new BillboardSprite(position, "Textures/Sprites/tree_large.png", 5f * scale, rotation, true);
    }

    public static Sprite createBush(Vector3f position, float scale, float rotation) {
        return new BillboardSprite(position, "Textures/Sprites/bush.png", 1f * scale, rotation, false);
    }

    public static Sprite createGrass(Vector3f position, float scale, float rotation) {
        return new BillboardSprite(position, "Textures/Sprites/grass.png", 0.5f * scale, rotation, false);
    }

    public static Sprite createRock(Vector3f position, float scale, float rotation) {
        return new BillboardSprite(position, "Textures/Sprites/rock.png", 1.5f * scale, rotation, true);
    }

    // Model Sprites
    public static Sprite createModelJaime(Vector3f position, float scale, float rotation) {
        return new ModelSprite(position, "Models/Jaime/Jaime.j3o", 1.5f * scale, rotation, true);
    }

    public static Sprite createModelNinja(Vector3f position, float scale, float rotation) {
        return new ModelSprite(position, "Models/Ninja/Ninja.j3o", 1.5f * scale, rotation, true);
    }

    public static Sprite createModelOto(Vector3f position, float scale, float rotation) {
        return new ModelSprite(position, "Models/Oto/Oto.j3o", 2.0f * scale, rotation, true);
    }

    public static Sprite createModelSinbad(Vector3f position, float scale, float rotation) {
        return new ModelSprite(position, "Models/Sinbad/Sinbad.j3o", 1.8f * scale, rotation, true);
    }

    // Convenience methods mit Random
    public static Sprite createRandomTree(Vector3f position, Random random) {
        float scale = 0.8f + random.nextFloat() * 0.4f; // 0.8 - 1.2
        float rotation = random.nextFloat() * (float) Math.PI * 2f;
        return random.nextBoolean()
                ? createTreeSmall(position, scale, rotation)
                : createTreeLarge(position, scale, rotation);
    }

    public static Sprite createRandomBush(Vector3f position, Random random) {
        float scale = 0.7f + random.nextFloat() * 0.6f;
        float rotation = random.nextFloat() * (float) Math.PI * 2f;
        return createBush(position, scale, rotation);
    }

    public static Sprite createRandomGrass(Vector3f position, Random random) {
        float scale = 0.5f + random.nextFloat() * 0.5f;
        float rotation = random.nextFloat() * (float) Math.PI * 2f;
        return createGrass(position, scale, rotation);
    }

    public static Sprite createRandomRock(Vector3f position, Random random) {
        float scale = 0.5f + random.nextFloat() * 1.0f;
        float rotation = random.nextFloat() * (float) Math.PI * 2f;
        return createRock(position, scale, rotation);
    }

    public static Sprite createRandomModel(Vector3f position, Random random) {
        float scale = 0.8f + random.nextFloat() * 0.4f; // 0.8 - 1.2
        float rotation = random.nextFloat() * (float) Math.PI * 2f;

        int type = random.nextInt(4);
        switch (type) {
            case 0: return createModelJaime(position, scale, rotation);
            case 1: return createModelNinja(position, scale, rotation);
            case 2: return createModelOto(position, scale, rotation);
            default: return createModelSinbad(position, scale, rotation);
        }
    }
}
