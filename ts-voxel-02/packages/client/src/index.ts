/**
 * VoxelSrv Client Entry Point
 */

import { VoxelClient } from './VoxelClient';

// Get canvas element
const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

// Create client
const client = new VoxelClient(canvas);

// Initialize and start
async function start() {
  try {
    await client.init();

    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }

    console.log('[Client] VoxelSrv client started successfully');
  } catch (error) {
    console.error('[Client] Failed to start:', error);
    alert('Failed to start VoxelSrv client. Check console for details.');
  }
}

start();
