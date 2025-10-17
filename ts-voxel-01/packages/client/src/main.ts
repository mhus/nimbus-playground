import { Engine } from '@babylonjs/core/Engines/engine';
import { Game } from './game/Game';

// Get canvas element
const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

// Create engine
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  disableWebGL2Support: false,
});

// Create game
const game = new Game(engine, canvas);

// Run render loop
engine.runRenderLoop(() => {
  game.update();
  game.render();
});

// Resize handler
window.addEventListener('resize', () => {
  engine.resize();
});

// Setup menu handlers
const menu = document.getElementById('menu')!;
const connectBtn = document.getElementById('connectBtn')!;
const playerNameInput = document.getElementById('playerName') as HTMLInputElement;
const serverUrlInput = document.getElementById('serverUrl') as HTMLInputElement;

connectBtn.addEventListener('click', () => {
  const playerName = playerNameInput.value.trim() || 'Player';
  const serverUrl = serverUrlInput.value.trim() || 'ws://localhost:3000';

  game.connect(serverUrl, playerName);
  menu.classList.add('hidden');
});
