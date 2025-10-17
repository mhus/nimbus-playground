/**
 * Generate Texture Atlas from individual block textures
 *
 * This script creates a 256x256 pixel atlas (16x16 textures at 16x16 each)
 * from the individual block textures defined in defaultAtlasConfig.ts
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Atlas configuration
const TEXTURE_SIZE = 16;
const ATLAS_WIDTH = 256;
const ATLAS_HEIGHT = 256;
const TEXTURES_PER_ROW = ATLAS_WIDTH / TEXTURE_SIZE;
const TEXTURES_PER_COLUMN = ATLAS_HEIGHT / TEXTURE_SIZE;

// Texture map from defaultAtlasConfig.ts
const textureMap = [
  // Row 0: Basic terrain
  ['block/stone', 0, 0],
  ['block/dirt', 1, 0],
  ['block/grass_top', 2, 0],
  ['block/grass_side', 3, 0],
  ['block/cobblestone', 4, 0],
  ['block/planks', 5, 0],
  ['block/sand', 6, 0],
  ['block/gravel', 7, 0],

  // Row 1: Wood & Trees
  ['block/log', 0, 1],
  ['block/log_top', 1, 1],
  ['block/leaves', 2, 1],
  ['block/oak_planks', 3, 1],

  // Row 3: Ores & Minerals
  ['block/coal_ore', 0, 3],
  ['block/iron_ore', 1, 3],
  ['block/diamond_ore', 2, 3],

  // Row 15: Special/placeholder
  ['missing', 0, 15],
];

const TEXTURES_DIR = path.join(__dirname, '../public/textures');
const OUTPUT_PATH = path.join(__dirname, '../public/textures/atlas.png');

async function generateAtlas() {
  console.log('[GenerateAtlas] Starting atlas generation...');
  console.log(`[GenerateAtlas] Atlas size: ${ATLAS_WIDTH}x${ATLAS_HEIGHT}`);
  console.log(`[GenerateAtlas] Texture size: ${TEXTURE_SIZE}x${TEXTURE_SIZE}`);
  console.log(`[GenerateAtlas] Grid: ${TEXTURES_PER_ROW}x${TEXTURES_PER_COLUMN}`);

  // Create canvas
  const canvas = createCanvas(ATLAS_WIDTH, ATLAS_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Fill with magenta background (missing texture color)
  ctx.fillStyle = '#FF00FF';
  ctx.fillRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);

  let loadedCount = 0;
  let missingCount = 0;

  // Load and place textures
  for (const [textureName, gridX, gridY] of textureMap) {
    const texturePath = path.join(TEXTURES_DIR, `${textureName}.png`);

    const x = gridX * TEXTURE_SIZE;
    const y = gridY * TEXTURE_SIZE;

    try {
      if (fs.existsSync(texturePath)) {
        const image = await loadImage(texturePath);
        ctx.drawImage(image, x, y, TEXTURE_SIZE, TEXTURE_SIZE);
        loadedCount++;
      } else {
        console.warn(`[GenerateAtlas] Missing texture: ${texturePath}`);
        // Draw missing texture pattern (magenta/black checkerboard)
        for (let cy = 0; cy < TEXTURE_SIZE; cy++) {
          for (let cx = 0; cx < TEXTURE_SIZE; cx++) {
            const isMagenta = ((cx / 4) % 2 < 1) === ((cy / 4) % 2 < 1);
            ctx.fillStyle = isMagenta ? '#FF00FF' : '#000000';
            ctx.fillRect(x + cx, y + cy, 1, 1);
          }
        }
        missingCount++;
      }
    } catch (error) {
      console.error(`[GenerateAtlas] Error loading ${textureName}:`, error.message);
      missingCount++;
    }
  }

  // Save atlas
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(OUTPUT_PATH, buffer);

  console.log(`[GenerateAtlas] Atlas generated successfully!`);
  console.log(`[GenerateAtlas] Output: ${OUTPUT_PATH}`);
  console.log(`[GenerateAtlas] Loaded: ${loadedCount} textures`);
  console.log(`[GenerateAtlas] Missing: ${missingCount} textures`);
}

// Run
generateAtlas().catch(error => {
  console.error('[GenerateAtlas] Failed to generate atlas:', error);
  process.exit(1);
});
