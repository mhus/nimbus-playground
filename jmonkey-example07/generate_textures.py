#!/usr/bin/env python3
"""
Generiert einfache Placeholder-Texturen für Sprites
"""

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("PIL/Pillow nicht installiert. Installiere mit: pip3 install Pillow")
    exit(1)

import os

output_dir = "src/main/resources/Textures/Sprites"
os.makedirs(output_dir, exist_ok=True)

def create_tree_small():
    """Kleiner Baum - Grüne Krone, brauner Stamm"""
    img = Image.new('RGBA', (64, 128), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Stamm (braun)
    draw.rectangle([28, 80, 36, 128], fill=(101, 67, 33, 255))

    # Krone (dunkelgrün)
    draw.ellipse([10, 20, 54, 90], fill=(34, 139, 34, 255))

    img.save(os.path.join(output_dir, "tree_small.png"))
    print("✓ tree_small.png erstellt")

def create_tree_large():
    """Großer Baum - Größere grüne Krone"""
    img = Image.new('RGBA', (96, 192), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Stamm (braun)
    draw.rectangle([42, 120, 54, 192], fill=(101, 67, 33, 255))

    # Krone (dunkelgrün, größer)
    draw.ellipse([5, 30, 91, 140], fill=(34, 139, 34, 255))

    img.save(os.path.join(output_dir, "tree_large.png"))
    print("✓ tree_large.png erstellt")

def create_bush():
    """Busch - Hellgrüner Kreis"""
    img = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Busch (hellgrün)
    draw.ellipse([4, 10, 44, 44], fill=(124, 252, 0, 255))

    img.save(os.path.join(output_dir, "bush.png"))
    print("✓ bush.png erstellt")

def create_grass():
    """Gras - Mehrere grüne Striche"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Grashalme (hellgrün)
    for x in [8, 16, 24]:
        draw.line([(x, 32), (x, 16), (x-2, 12)], fill=(144, 238, 144, 255), width=2)

    img.save(os.path.join(output_dir, "grass.png"))
    print("✓ grass.png erstellt")

def create_rock():
    """Stein - Grauer Kreis"""
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Stein (grau)
    draw.ellipse([8, 20, 56, 60], fill=(128, 128, 128, 255))

    # Schatten
    draw.ellipse([10, 22, 54, 58], fill=(90, 90, 90, 255))

    img.save(os.path.join(output_dir, "rock.png"))
    print("✓ rock.png erstellt")

if __name__ == "__main__":
    print("Generiere Sprite-Texturen...")
    create_tree_small()
    create_tree_large()
    create_bush()
    create_grass()
    create_rock()
    print("\nAlle Texturen erstellt in:", output_dir)
