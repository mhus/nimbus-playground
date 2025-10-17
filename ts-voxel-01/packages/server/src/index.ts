import { WebSocketServer } from 'ws';
import chalk from 'chalk';
import { GameServer } from './server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const wss = new WebSocketServer({ port: PORT });
const gameServer = new GameServer();

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

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Shutting down server...'));
  wss.close(() => {
    console.log(chalk.green('Server closed'));
    process.exit(0);
  });
});
