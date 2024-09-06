import puppeteer from 'puppeteer';
import { cache } from '../conf/CACHECONF';
import axios from 'axios';

const OPENWEATHER_API_KEY: string = 'e7b9354c6a7c69311fef772ab2cb313e';
const DEFAULT_UNITS = 'metric';

class WeatherService {
  static async getWeather(city: string, units: string = DEFAULT_UNITS): Promise<string> {
    const cacheKey = `${city}_${units}`;
    const cachedData = cache.get<string>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: city,
          appid: OPENWEATHER_API_KEY,
          units: units,
        },
      });

      const { temp, humidity } = response.data.main;
      const { description } = response.data.weather[0];
      const weatherData = `Погода в ${city}: ${temp}° сейчас ${description}. Влажность: ${humidity}%`;

      cache.set(cacheKey, weatherData);

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather from API:', error);
      console.log('Falling back to Puppeteer...');

      return await this.getWeatherWithPuppeteer(city);
    }
  }

  static async getForecast(city: string, units: string = DEFAULT_UNITS): Promise<string> {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
        params: {
          q: city,
          appid: OPENWEATHER_API_KEY,
          units: units,
        },
      });

      const forecast = response.data.list.slice(0, 5).map((item: any) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        const { temp } = item.main;
        const { description } = item.weather[0];
        return `${date}: ${temp}° ${description}`;
      }).join('\n');

      return `Прогноз погоды в ${city} на ближайшие дни:\n${forecast}`;
    } catch (error) {
      console.error('Error fetching forecast from API:', error);
      return 'Ошибка при получении прогноза погоды.';
    }
  }

  static async getWeatherWithPuppeteer(city: string): Promise<string> {
    const cacheKey = `${city}_puppeteer`;
    const cachedData = cache.get<string>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let weatherData = 'Ошибка получения данных о погоде через Puppeteer.';

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Замените URL на URL страницы погоды для вашего города
      await page.goto(`https://weather.com/en-IN/weather/today/l/${city}`, { waitUntil: 'networkidle2' });

      weatherData = await page.evaluate(() => {
        const tempElement = document.querySelector('.CurrentConditions--tempValue--3a50n') as HTMLElement | null;
        const descriptionElement = document.querySelector('.CurrentConditions--phraseValue--2xXSr') as HTMLElement | null;
        
        const temp = tempElement ? tempElement.textContent : 'No temperature data';
        const description = descriptionElement ? descriptionElement.textContent : 'No description data';
        
        return (temp === 'No temperature data' || description === 'No description data')
          ? 'Ошибка получения данных о погоде через Puppeteer.'
          : `Current weather in city: ${temp} with ${description}`;
      });

      await browser.close();

      cache.set(cacheKey, weatherData);
    } catch (error) {
      console.error('Error with Puppeteer:', error);
    }

    return weatherData;
  }
}

export default WeatherService;
