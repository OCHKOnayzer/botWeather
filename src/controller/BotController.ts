import { bot } from '../conf/StartBotConfig';
import WeatherService from '../service/WeatherService';
import { Markup } from 'telegraf';
import axios from 'axios';

const OPENWEATHER_API_KEY: string = 'e7b9354c6a7c69311fef772ab2cb313e';

const userSessions: { [key: string]: { city?: string, units?: string } } = {};

const SendFunctionStart = async (ctx: any) => {
    await ctx.reply(
        'Привет! Используй кнопки, чтобы узнать погоду.',
        Markup.inlineKeyboard([
            Markup.button.callback('Выбрать город', 'change_city'),
            Markup.button.callback('Выбрать единицы измерения', 'set_units'),
            Markup.button.callback('Получить погоду по геолокации', 'get_location')
        ])
    );
};

const SendFunction = async (ctx: any) => {
    await ctx.reply(
        'Можете изменить метрику или выбрать другой город.',
        Markup.inlineKeyboard([
            Markup.button.callback('Изменить метрику', 'set_units'),
            Markup.button.callback('Изменить город', 'change_city'),
            Markup.button.callback('Прогноз на несколько дней', 'forecast'),
            Markup.button.callback('Получить погоду по геолокации', 'get_location')
        ])
    );
};

const ErrorCommands = async (ctx: any) => {
    await ctx.reply(
        'Чтобы узнать погоду в вашем городе, введите его название, например Москва или Moscow',
        Markup.inlineKeyboard([
            Markup.button.callback('Выбрать город', 'change_city')
        ])
    );
};

bot.start((ctx) => {
    SendFunctionStart(ctx);
});

bot.action('change_city', async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (chatId) { 
        userSessions[chatId] = { ...userSessions[chatId], city: undefined };
        ctx.reply('Введите название города, например Москва или Moscow');
    }
});

bot.action('set_units', async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (chatId) { 
        userSessions[chatId] = { ...userSessions[chatId], units: undefined };
        ctx.reply('Пожалуйста, выберите единицы измерения:\n1. Metric (°C)\n2. Imperial (°F)\n3. Standard (K)');
    }
});

bot.action('forecast', async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (chatId) {
        const userCity = userSessions[chatId]?.city;
        if (userCity) {
            const forecastData = await WeatherService.getForecast(userCity, userSessions[chatId]?.units);
            ctx.reply(`Прогноз погоды для города ${userCity}:\n${forecastData}`);
        } else {
            ctx.reply('Город не установлен. Пожалуйста, установите город, введя название города.');
        }
    }
});

bot.action('get_location', async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (chatId) {
        ctx.reply('Пожалуйста, отправьте вашу геолокацию, чтобы получить погоду.');
    }
});

bot.on('text', async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    const text = ctx.message.text;

    if (chatId) {
        if (userSessions[chatId]?.city === undefined) {
            userSessions[chatId] = { ...userSessions[chatId], city: text };
            ctx.reply(`Выбран город ${text}`);
            const weatherData = await WeatherService.getWeather(text, userSessions[chatId]?.units);
            ctx.reply(weatherData);

            setTimeout(() => {
                SendFunction(ctx);
            }, 100);
        } else if (userSessions[chatId]?.units === undefined) {
            switch (text) {
                case '1':
                    userSessions[chatId] = { ...userSessions[chatId], units: 'metric' };
                    ctx.reply('Выбраны единицы измерения Metric (°C)');
                    break;
                case '2':
                    userSessions[chatId] = { ...userSessions[chatId], units: 'imperial' };
                    ctx.reply('Выбраны единицы измерения Imperial (°F)');
                    break;
                case '3':
                    userSessions[chatId] = { ...userSessions[chatId], units: 'standard' };
                    ctx.reply('Выбраны единицы измерения Standard (K)');
                    break;
                default:
                    ctx.reply('Пожалуйста, выберите корректные единицы измерения:\n1. Metric (°C)\n2. Imperial (°F)\n3. Standard (K)');
                    return;
            }

            // Показываем погоду после изменения единиц измерения, если город был установлен
            const userCity = userSessions[chatId]?.city;
            if (userCity) {
                const weatherData = await WeatherService.getWeather(userCity, userSessions[chatId]?.units);
                ctx.reply(`Обновленная погода для города ${userCity}:\n${weatherData}`);
            }

            setTimeout(() => {
                SendFunction(ctx);
            }, 100);
        } else {
            ErrorCommands(ctx);
        }
    }
});

bot.command('mycity', async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (chatId) {
        const userCity = userSessions[chatId]?.city;
        if (userCity) {
            const weatherData = await WeatherService.getWeather(userCity, userSessions[chatId]?.units);
            ctx.reply(`Ваш сохраненный город: ${userCity}\n${weatherData}`);
        } else {
            ctx.reply('Город не найден или введены некорректные данные. Пожалуйста, установите город, введя название города, например Москва или Moscow.');
        }
    }
});

// Обработка геолокации
bot.on('location', async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (chatId) {
        const { latitude, longitude } = ctx.message.location;
        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    appid: OPENWEATHER_API_KEY,
                    units: userSessions[chatId]?.units || 'metric',
                },
            });

            const { temp, weather } = response.data.main;
            const description = weather[0]?.description || 'No description';
            const weatherData = `Ваше текущее местоположение: ${temp}° ${description}`;

            ctx.reply(weatherData);
        } catch (error) {
            console.error('Error fetching weather by location:', error);
            ctx.reply('Не удалось получить данные о погоде по вашей геолокации.');
        }
    }
});
