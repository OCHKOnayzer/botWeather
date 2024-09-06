import WeatherService from './service/WeatherService';
import axios from 'axios';
import { cache } from './conf/CACHECONF';

// Мокируем axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
  beforeEach(() => {
    cache.flushAll();
  });

  it('should return cached weather data', async () => {
    const city = 'Moscow';
    const units = 'metric';
    const mockWeatherData = 'Погода в Moscow: 20° сейчас clear. Влажность: 50%';

    cache.set(`${city}_${units}`, mockWeatherData);

    const weatherData = await WeatherService.getWeather(city, units);
    expect(weatherData).toBe(mockWeatherData); // Используем toBe для сравнения строк
  });

  it('should fetch weather data from API and cache it', async () => {
    const city = 'Moscow';
    const units = 'metric';
    const mockResponse = {
      data: {
        main: { temp: 20, humidity: 50 },
        weather: [{ description: 'clear' }]
      }
    };

    mockedAxios.get.mockResolvedValue(mockResponse);

    const weatherData = await WeatherService.getWeather(city, units);
    expect(weatherData).toContain('Погода в Moscow: 20° сейчас clear. Влажность: 50%');
    expect(cache.get(`${city}_${units}`)).toBe(weatherData); // Проверяем кэш
  });

  it('should handle API error and use Puppeteer', async () => {
    const city = 'Moscow';
    const units = 'metric';
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    const weatherData = await WeatherService.getWeather(city, units);
    expect(weatherData).toContain('Ошибка получения данных о погоде через Puppeteer');
  });
});
