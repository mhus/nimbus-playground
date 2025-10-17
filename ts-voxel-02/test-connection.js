// Quick test to verify WebSocket connection
import WebSocket from 'ws';

console.log('Testing WebSocket connection to ws://localhost:3003...');

const ws = new WebSocket('ws://localhost:3003');

ws.on('open', () => {
  console.log('✓ Connected!');

  // Send a chunk request
  const message = { type: 'request_chunk', chunkX: 0, chunkZ: 0 };
  console.log('Sending:', message);
  ws.send(JSON.stringify(message));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message.type);

  if (message.type === 'chunk_data') {
    console.log(`✓ Chunk data received: ${message.chunkX},${message.chunkZ} with ${message.data.length} blocks`);

    // Count non-air blocks
    const nonAirBlocks = message.data.filter(id => id !== 0).length;
    console.log(`  Non-air blocks: ${nonAirBlocks}`);

    ws.close();
    process.exit(0);
  }
});

ws.on('error', (error) => {
  console.error('✗ Connection error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('Connection closed');
});

setTimeout(() => {
  console.error('✗ Timeout - no response received');
  ws.close();
  process.exit(1);
}, 5000);
