import { bot } from '../conf/StartBotConfig';
import WeatherService from '../service/WeatherService';
import { Markup } from 'telegraf';

// Объект для хранения данных о пользователях (память на уровне сессии)
const userSessions: { [key: string]: { city?: string, units?: string } } = {};

// Функция для старта бота и установки начальных кнопок
const SendFunctionStart = async (ctx: any) => {
    await ctx.reply(
        'Привет! Используй кнопки, чтобы узнать погоду.',
        Markup.inlineKeyboard([
            Markup.button.callback('Выбрать город', 'change_city'),
            Markup.button.callback('Выбрать единицы измерения', 'set_units')
        ])
    );
};

const SendFunction = async (ctx: any) => {
    await ctx.reply(
        'Можете изменить метрику или выбрать другой город.',
        Markup.inlineKeyboard([
            Markup.button.callback('Изменить метрику', 'set_units'),
            Markup.button.callback('Изменить город', 'change_city')
        ])
    );
};

const ErrorComands = async(ctx:any)=>{ 
    await ctx.reply(
        'Чтобы узнать погоду в вашем городе , пиши Город <название города>',
        Markup.inlineKeyboard([
            Markup.button.callback('Выбрать город', 'change_city')
        ])
    );
}

// Начальная команда /start
bot.start((ctx) => {
    SendFunctionStart(ctx);
});

bot.action('change_city', async (ctx) => {
    ctx.reply('Чтобы узнать погоду в вашем городе , пиши Город <название города>');
});

bot.action('set_units', async (ctx) => {
    ctx.reply('Пожалуйста, выберите единицы измерения:\n1. Metric (°C)\n2. Imperial (°F)\n3. Standard (K)');
});


bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const text = ctx.message.text;

    
    if (text.startsWith('')) {
        const city = text
        userSessions[chatId] = { ...userSessions[chatId], city };

        ctx.reply(`Выбран город ${city}`);

        const weatherData = await WeatherService.getWeather(city);
        ctx.reply(weatherData);

        setTimeout(() => {
            SendFunction(ctx);
        }, 100);
    } else {
        ErrorComands(ctx)
    }
});

bot.command('mycity', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const userCity = userSessions[chatId]?.city;

    if (userCity) {
        const weatherData = await WeatherService.getWeather(userCity);
        ctx.reply(`Ваш сохраненный город: ${userCity}\n${weatherData}`);
    } else {
        ctx.reply('Город не найден. Пожалуйста, установите город, используя команду "Город <имя города>".');
    }
});