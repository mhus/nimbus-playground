import { WebSocketServer } from 'ws';
import chalk from 'chalk';
import { GameServer } from './server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function main() {
  const gameServer = new GameServer();

  // Initialize world (load or create)
  await gameServer.init();

  const wss = new WebSocketServer({ port: PORT });

  console.log(chalk.green(`🎮 Voxel Server started on port ${PORT}`));
  console.log(chalk.blue(`Connect at: ws://localhost:${PORT}`));

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(chalk.yellow(`New connection from ${clientIp}`));

    gameServer.handleConnection(ws);
  });

  wss.on('error', (error) => {
    console.error(chalk.red('WebSocket Server Error:'), error);
  });

  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Shutting down server...'));
    await gameServer.shutdown();
    wss.close(() => {
      console.log(chalk.green('Server closed'));
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error(chalk.red('Failed to start server:'), error);
  process.exit(1);
});
