import { UrlParamsType } from './types';

class GoGoAnime {
  private readonly baseUrl: string;

  constructor(baseUrl = 'https://gogoanime.ai') {
    this.baseUrl = baseUrl;
  }

  getUrlWithBase(path: string, params?: UrlParamsType) {
    const url = new URL(path, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  getBaseUrl() {
    return this.baseUrl;
  }
}

export default new GoGoAnime();
