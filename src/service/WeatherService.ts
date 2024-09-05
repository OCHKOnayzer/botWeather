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

      const { temp } = response.data.main;
      const { description } = response.data.weather[0];
      const weatherData = `Current weather in ${city}: ${temp}° with ${description}`;

      cache.set(cacheKey, weatherData);

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return 'Failed to fetch weather data. Please try again later.';
    }
  }
}

export default WeatherService;
