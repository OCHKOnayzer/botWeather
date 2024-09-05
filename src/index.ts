import dotenv from 'dotenv';
import express from 'express';
import { bot } from './conf/StartBotConfig'; // Ваш бот

dotenv.config(); // Инициализация dotenv

const app = express();
const port = process.env.PORT || 3000;

// Основной маршрут
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Запуск бота
bot.launch().then(() => console.log('Bot is running'));

// Обработка завершения работы
process.on('SIGINT', () => {
  console.log('Shutting down...');
  bot.stop('SIGINT');
  process.exit(0);
});

// Команды бота
import './controller/BotController'; // Импорт команд и обработчиков бота
