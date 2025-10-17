/**
 * VoxelSrv Server Entry Point
 */

import { VoxelServer } from './VoxelServer.js';

const server = new VoxelServer({
  port: 3001,
  worldName: 'world',
  worldSeed: Math.floor(Math.random() * 1000000),
  generator: 'normal',  // 'flat' or 'normal'
});

server.start().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] Shutting down...');
  await server.stop();
  process.exit(0);
});
