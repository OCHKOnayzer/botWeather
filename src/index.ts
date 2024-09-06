import dotenv from 'dotenv';
import express from 'express';
import { bot } from './conf/StartBotConfig';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

bot.launch().then(() => console.log('Bot is running'));

process.on('SIGINT', () => {
  console.log('Shutting down...');
  bot.stop('SIGINT');
  process.exit(0);
});

import './controller/BotController';
