#!/usr/bin/env python3
"""
Terrain Generator für Babylon.js Terrain System
Generiert JSON-Dateien mit Seen, Flüssen und Wüsten für das Tile-basierte Terrain.
"""

import json
import random
import math
from datetime import datetime
from typing import List, Dict, Any


class TerrainGenerator:
    def __init__(self, world_size: int = 200):
        self.world_size = world_size
        self.terrain_data = {
            "version": "1.0",
            "worldSize": world_size,
            "metadata": {
                "name": "Generiertes Terrain",
                "description": "Prozedural generiertes Terrain mit Seen, Flüssen und Wüsten",
                "created": datetime.now().isoformat(),
                "author": "TerrainGenerator"
            },
            "tiles": {},
            "features": {
                "lakes": [],
                "rivers": [],
                "deserts": []
            }
        }

    def generate_lakes(self, count: int = 8) -> List[Dict[str, Any]]:
        """Generiert zufällige Seen im Terrain"""
        lakes = []

        # Seen-Namen für Atmosphäre
        lake_names = [
            "Kristallsee", "Tiefensee", "Bergsee", "Waldteich", "Mondschein-See",
            "Smaragd-See", "Nebelsee", "Stiller See", "Drachensee", "Gebirgssee",
            "Verborgener See", "Spiegel-See", "Azur-See", "Runen-See", "Echo-See"
        ]

        for i in range(count):
            # Zufällige Position im Terrain
            x = random.randint(20, self.world_size - 20)
            y = random.randint(20, self.world_size - 20)

            # Radius abhängig von der Größe des Terrains
            min_radius = max(5, self.world_size // 40)
            max_radius = max(15, self.world_size // 15)
            radius = random.randint(min_radius, max_radius)

            lake = {
                "x": x,
                "y": y,
                "radius": radius,
                "name": random.choice(lake_names) if lake_names else f"See {i+1}"
            }

            # Namen aus der Liste entfernen um Duplikate zu vermeiden
            if lake["name"] in lake_names:
                lake_names.remove(lake["name"])

            lakes.append(lake)

        return lakes

    def generate_rivers(self, lakes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generiert Flüsse, die Seen miteinander verbinden"""
        rivers = []

        if len(lakes) < 2:
            return rivers

        river_names = [
            "Silberfluss", "Steinbach", "Waldstrom", "Bergbach", "Tiefenfluss",
            "Kristallbach", "Mondschein-Fluss", "Nebelstrom", "Drachenfluss",
            "Runenbach", "Echo-Fluss", "Zauberbach", "Himmelsstrom"
        ]

        # Hauptfluss-Netzwerk: Jeden See mit mindestens einem anderen verbinden
        connected_lakes = set()

        # Erster Fluss zwischen zwei zufälligen Seen
        lake1, lake2 = random.sample(lakes, 2)
        river = self.create_river(lake1, lake2, river_names)
        rivers.append(river)
        connected_lakes.update([id(lake1), id(lake2)])

        # Weitere Seen ans Netzwerk anschließen
        remaining_lakes = [lake for lake in lakes if id(lake) not in connected_lakes]

        while remaining_lakes:
            # Nächsten See mit dem Netzwerk verbinden
            new_lake = remaining_lakes.pop(0)
            connected_lake = random.choice([lake for lake in lakes if id(lake) in connected_lakes])

            river = self.create_river(connected_lake, new_lake, river_names)
            rivers.append(river)
            connected_lakes.add(id(new_lake))

        # Zusätzliche Flüsse für komplexeres Netzwerk
        additional_rivers = min(3, len(lakes) // 2)
        for _ in range(additional_rivers):
            if len(lakes) >= 2:
                lake1, lake2 = random.sample(lakes, 2)
                # Nur wenn noch nicht direkt verbunden
                existing_connection = any(
                    (r["from"]["x"] == lake1["x"] and r["from"]["y"] == lake1["y"] and
                     r["to"]["x"] == lake2["x"] and r["to"]["y"] == lake2["y"]) or
                    (r["from"]["x"] == lake2["x"] and r["from"]["y"] == lake2["y"] and
                     r["to"]["x"] == lake1["x"] and r["to"]["y"] == lake1["y"])
                    for r in rivers
                )

                if not existing_connection:
                    river = self.create_river(lake1, lake2, river_names)
                    rivers.append(river)

        return rivers

    def create_river(self, lake1: Dict[str, Any], lake2: Dict[str, Any],
                    river_names: List[str]) -> Dict[str, Any]:
        """Erstellt einen einzelnen Fluss zwischen zwei Seen"""
        distance = math.sqrt((lake2["x"] - lake1["x"])**2 + (lake2["y"] - lake1["y"])**2)

        # Flussbreite abhängig von der Entfernung
        width = max(2, min(8, int(distance / 20)))

        # Gelegentlich geschwungene Flüsse
        curved = random.random() < 0.4

        river = {
            "from": {"x": lake1["x"], "y": lake1["y"]},
            "to": {"x": lake2["x"], "y": lake2["y"]},
            "width": width,
            "name": random.choice(river_names) if river_names else f"Fluss {len(river_names)}"
        }

        if curved:
            river["curved"] = True

        # Namen aus der Liste entfernen
        if river["name"] in river_names:
            river_names.remove(river["name"])

        return river

    def generate_deserts(self, count: int = 4) -> List[Dict[str, Any]]:
        """Generiert Wüstengebiete"""
        deserts = []

        desert_names = [
            "Große Wüste", "Feuerwüste", "Sandmeer", "Goldene Dünen", "Endlose Wüste",
            "Kristallwüste", "Mondwüste", "Dornenwüste", "Glühende Wüste", "Steinwüste"
        ]

        for i in range(count):
            # Wüsten-Dimensionen
            min_size = max(20, self.world_size // 20)
            max_size = max(40, self.world_size // 8)

            width = random.randint(min_size, max_size)
            height = random.randint(min_size, max_size)

            # Position so dass Wüste vollständig im Terrain liegt
            x = random.randint(0, self.world_size - width)
            y = random.randint(0, self.world_size - height)

            desert = {
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "name": random.choice(desert_names) if desert_names else f"Wüste {i+1}"
            }

            # Namen aus der Liste entfernen
            if desert["name"] in desert_names:
                desert_names.remove(desert["name"])

            deserts.append(desert)

        return deserts

    def generate_terrain_tiles(self, sample_rate: float = 0.1):
        """
        Generiert vollständige Tile-Daten für das gesamte Terrain
        Erstellt zuerst eine Basis-Schicht aus Gras, dann werden Features darüber gelegt
        """
        tiles = {}
        total_tiles = self.world_size * self.world_size

        print(f"Generiere Basis-Terrain ({self.world_size}x{self.world_size} = {total_tiles:,} Tiles)...")

        # 1. Schritt: Alle Tiles mit Basis-Gras füllen
        for y in range(self.world_size):
            for x in range(self.world_size):
                key = f"{x},{y}"

                # Standard Gras-Tile mit gelegentlicher Vegetation
                levels = [{"level": 0, "texture": "grass"}]

                # 60% Chance auf Vegetation (Büsche)
                if random.random() < 0.6:
                    levels.append({"level": 1, "texture": "grass_bushes"})

                tiles[key] = {"levels": levels}

        print(f"Basis-Terrain erstellt. Überschreibe mit Features...")

        # 2. Schritt: Seen überschreiben die Basis
        for lake in self.terrain_data["features"]["lakes"]:
            for y in range(self.world_size):
                for x in range(self.world_size):
                    distance = math.sqrt((x - lake["x"])**2 + (y - lake["y"])**2)
                    if distance <= lake["radius"]:
                        key = f"{x},{y}"
                        tiles[key] = {
                            "levels": [{"level": 0, "texture": "water"}]
                        }

        # 3. Schritt: Flüsse überschreiben die Basis
        for river in self.terrain_data["features"]["rivers"]:
            for y in range(self.world_size):
                for x in range(self.world_size):
                    if self.is_on_river(x, y, river):
                        key = f"{x},{y}"
                        tiles[key] = {
                            "levels": [{"level": 0, "texture": "water"}]
                        }

        # 4. Schritt: Wüsten überschreiben die Basis (aber nicht Wasser)
        for desert in self.terrain_data["features"]["deserts"]:
            for y in range(max(0, desert["y"]), min(self.world_size, desert["y"] + desert["height"])):
                for x in range(max(0, desert["x"]), min(self.world_size, desert["x"] + desert["width"])):
                    key = f"{x},{y}"
                    # Nur überschreiben wenn es kein Wasser ist
                    if tiles[key]["levels"][0]["texture"] != "water":
                        levels = [{"level": 0, "texture": "dirt"}]

                        # 30% Chance auf Steine in der Wüste
                        if random.random() < 0.3:
                            levels.append({"level": 1, "texture": "dirt_stones"})

                        tiles[key] = {"levels": levels}

        print(f"Vollständiges Terrain generiert: {len(tiles):,} Tiles")
        return tiles

    def is_on_river(self, x: int, y: int, river: Dict[str, Any]) -> bool:
        """Prüft ob ein Punkt auf einem Fluss liegt"""
        x1, y1 = river["from"]["x"], river["from"]["y"]
        x2, y2 = river["to"]["x"], river["to"]["y"]
        width = river["width"]

        if river.get("curved", False):
            return self.is_on_curved_river(x, y, x1, y1, x2, y2, width)
        else:
            return self.is_on_straight_river(x, y, x1, y1, x2, y2, width)

    def is_on_straight_river(self, x: int, y: int, x1: int, y1: int, x2: int, y2: int, width: int) -> bool:
        """Prüft ob ein Punkt auf einem geraden Fluss liegt"""
        # Distanz von Punkt zur Linie berechnen
        A = y2 - y1
        B = x1 - x2
        C = x2 * y1 - x1 * y2

        if A == 0 and B == 0:  # Vermeidung Division durch Null
            return False

        distance = abs(A * x + B * y + C) / math.sqrt(A * A + B * B)

        # Prüfen ob Punkt innerhalb der Liniensegment-Grenzen liegt
        dot_product = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)
        squared_length = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)

        if squared_length == 0:  # Vermeidung Division durch Null
            return distance <= width

        t = max(0, min(1, dot_product / squared_length))

        return distance <= width and 0 <= t <= 1

    def is_on_curved_river(self, x: int, y: int, x1: int, y1: int, x2: int, y2: int, width: int) -> bool:
        """Prüft ob ein Punkt auf einem geschwungenen Fluss liegt"""
        if y2 == y1:  # Vermeidung Division durch Null
            return self.is_on_straight_river(x, y, x1, y1, x2, y2, width)

        # Einfache Kurve durch Sinus-Modulation
        progress = (y - min(y1, y2)) / abs(y2 - y1)
        if progress < 0 or progress > 1:
            return False

        # Berechne erwartete X-Position auf der Kurve
        base_x = x1 + (x2 - x1) * progress
        curve_offset = math.sin(progress * math.pi * 2) * 20  # Sinus-Kurve mit 20px Amplitude
        expected_x = base_x + curve_offset

        return abs(x - expected_x) <= width

    def generate_full_terrain(self, lake_count: int = 8, desert_count: int = 4,
                            tile_sample_rate: float = 0.05) -> Dict[str, Any]:
        """Generiert ein vollständiges Terrain mit allen Features"""
        print(f"Generiere Terrain ({self.world_size}x{self.world_size})...")

        # Seen generieren
        print(f"Generiere {lake_count} Seen...")
        lakes = self.generate_lakes(lake_count)
        self.terrain_data["features"]["lakes"] = lakes

        # Flüsse zwischen Seen generieren
        print("Generiere Fluss-Netzwerk...")
        rivers = self.generate_rivers(lakes)
        self.terrain_data["features"]["rivers"] = rivers

        # Wüsten generieren
        print(f"Generiere {desert_count} Wüsten...")
        deserts = self.generate_deserts(desert_count)
        self.terrain_data["features"]["deserts"] = deserts

        # Beispiel-Tiles generieren
        print(f"Generiere Beispiel-Tiles ({tile_sample_rate*100:.1f}% Sampling)...")
        tiles = self.generate_terrain_tiles(tile_sample_rate)
        self.terrain_data["tiles"] = tiles

        # Statistiken aktualisieren
        stats = self.get_terrain_stats()
        self.terrain_data["metadata"]["description"] = (
            f"Terrain mit {stats['lakes']} Seen, {stats['rivers']} Flüssen, "
            f"{stats['deserts']} Wüsten und {stats['sample_tiles']} Beispiel-Tiles"
        )

        print("Terrain-Generierung abgeschlossen!")
        print(f"Features: {stats['lakes']} Seen, {stats['rivers']} Flüsse, {stats['deserts']} Wüsten")
        print(f"Tiles: {stats['sample_tiles']} von {self.world_size*self.world_size} definiert")

        return self.terrain_data

    def get_terrain_stats(self) -> Dict[str, int]:
        """Gibt Statistiken über das generierte Terrain zurück"""
        return {
            "lakes": len(self.terrain_data["features"]["lakes"]),
            "rivers": len(self.terrain_data["features"]["rivers"]),
            "deserts": len(self.terrain_data["features"]["deserts"]),
            "sample_tiles": len(self.terrain_data["tiles"]),
            "total_tiles": self.world_size * self.world_size
        }

    def save_to_file(self, filename: str = "assets/terrain.json", compact: bool = True):
        """Speichert das Terrain in eine JSON-Datei"""
        if compact:
            # Kompakte Speicherung ohne Einrückung
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.terrain_data, f, separators=(',', ':'), ensure_ascii=False)
        else:
            # Formatierte Speicherung mit Einrückung
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.terrain_data, f, indent=2, ensure_ascii=False)
        print(f"Terrain gespeichert in: {filename} ({'kompakt' if compact else 'formatiert'})")


def main():
    """Hauptfunktion für Command-Line-Interface"""
    import argparse

    parser = argparse.ArgumentParser(description="Terrain Generator für Babylon.js")
    parser.add_argument("--size", type=int, default=200, help="Weltgröße (default: 200)")
    parser.add_argument("--lakes", type=int, default=8, help="Anzahl Seen (default: 8)")
    parser.add_argument("--deserts", type=int, default=4, help="Anzahl Wüsten (default: 4)")
    parser.add_argument("--sampling", type=float, default=0.05, help="Tile-Sampling-Rate (default: 0.05)")
    parser.add_argument("--output", type=str, default="assets/terrain.json", help="Output-Datei (default: assets/terrain.json)")
    parser.add_argument("--seed", type=int, help="Random seed für reproduzierbare Ergebnisse")
    parser.add_argument("--formatted", action="store_true", help="JSON formatiert speichern (default: kompakt)")

    args = parser.parse_args()

    # Random Seed setzen falls angegeben
    if args.seed:
        random.seed(args.seed)
        print(f"Random seed: {args.seed}")

    # Terrain generieren
    generator = TerrainGenerator(args.size)
    terrain = generator.generate_full_terrain(
        lake_count=args.lakes,
        desert_count=args.deserts,
        tile_sample_rate=args.sampling
    )

    # In Datei speichern (kompakt ist Standard, formatiert nur wenn --formatted angegeben)
    generator.save_to_file(args.output, compact=not args.formatted)

    # Finale Statistiken
    stats = generator.get_terrain_stats()
    print("\n=== Terrain-Statistiken ===")
    print(f"Weltgröße: {args.size}x{args.size} = {stats['total_tiles']:,} Tiles")
    print(f"Seen: {stats['lakes']}")
    print(f"Flüsse: {stats['rivers']}")
    print(f"Wüsten: {stats['deserts']}")
    print(f"Explizite Tiles: {stats['sample_tiles']:,} ({args.sampling*100:.1f}%)")


if __name__ == "__main__":
    main()
