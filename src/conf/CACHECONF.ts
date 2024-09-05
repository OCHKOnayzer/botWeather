import NodeCache from 'node-cache';
const CACHE_TTL:number | any = process.env.CACHE_LIFE;
export const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 120 });