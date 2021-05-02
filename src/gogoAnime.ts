import axios, { AxiosRequestConfig } from 'axios';
import { load as cheerioLoad } from 'cheerio';
import { DEFAULT_CONFIG } from './constants';
import {
  GoGoAnimeConfig,
  IGenre,
  IPagination,
  IPopularOngoingUpdate,
  IRecentRelease,
  UrlParamsType
} from './types';
import { getIdFromPath } from './utils';

class GoGoAnime {
  private readonly baseUrl: string;
  private readonly recentReleaseUrl: string;
  private readonly popularOnGoingUrl: string;

  constructor(config?: GoGoAnimeConfig) {
    const { baseUrl, recentReleaseUrl, popularOngoingUpdateUrl } = {
      ...DEFAULT_CONFIG,
      ...config
    };

    this.baseUrl = baseUrl;
    this.recentReleaseUrl = recentReleaseUrl;
    this.popularOnGoingUrl = popularOngoingUpdateUrl;
  }

  async getRecentRelease(
    page?: number,
    type?: number,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IRecentRelease>> {
    const url = new URL(this.recentReleaseUrl);

    if (page) {
      url.searchParams.set('page', String(page));
    }

    if (type) {
      url.searchParams.set('type', String(type));
    }

    const res = await axios.get(url.toString(), axiosConfig);
    const $ = cheerioLoad(res.data);

    const paginations = new Array<number>();
    const series = new Array<IRecentRelease>();

    $(
      'div.anime_name_pagination.intro div.pagination.recent ul.pagination-list li'
    ).each((_, ele) => {
      const a = $(ele).children('a');

      const number = a.data('page');

      paginations.push(number);
    });

    $('div.last_episodes.loaddub ul.items li').each((_, ele) => {
      const a = $(ele).find('p.name a');
      const href = a.attr('href') ?? '';
      const name = a.attr('title') ?? '';

      const thumnail = $(ele).find('div.img a img').attr('src') ?? '';
      const episode = $(ele).find('p.episode').text().trim();

      const id = getIdFromPath(href);
      const link = new URL(href, this.baseUrl).toString();

      series.push({
        id,
        name,
        link,
        thumnail,
        episode
      });
    });

    return {
      page: page ?? 1,
      paginations,
      data: series
    };
  }

  async getPopularOnGoingSeries(
    page?: number,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IPopularOngoingUpdate>> {
    const url = new URL(this.popularOnGoingUrl);

    if (page) {
      url.searchParams.set('page', String(page));
    }

    const res = await axios.get(url.toString(), axiosConfig);
    const $ = cheerioLoad(res.data);

    const paginations = new Array<number>();
    const series = new Array<IPopularOngoingUpdate>();

    $(
      'div.anime_name_pagination div.pagination.popular ul.pagination-list li'
    ).each((_, ele) => {
      const a = $(ele).children('a');

      paginations.push(Number(a.data('page')));
    });

    $('div.added_series_body.popular ul li').each((_, ele) => {
      const style = $(ele).find('a div.thumbnail-popular').attr('style') ?? '';
      const thumnail = (() => {
        const match = style.match(/url\('(?<url>.+)'\);/);

        if (match && match.groups) {
          const url = match.groups['url'];

          if (url) {
            return url;
          }
        }

        return '';
      })();

      const a = $(ele).children('a');
      const href = a.attr('href') ?? '';
      const name = a.attr('title') ?? '';

      const id = getIdFromPath(href);
      const link = new URL(href, this.baseUrl).toString();

      const genres = new Array<IGenre>();

      $(ele)
        .find('p.genres a')
        .each((_, _ele) => {
          const _href = $(_ele).attr('href') ?? '';
          const _title = $(_ele).attr('title') ?? '';

          const _id = getIdFromPath(_href);
          const _link = new URL(_href, this.baseUrl).toString();

          genres.push({ id: _id, title: _title, link: _link });
        });

      series.push({ id, name, link, thumnail, genres });
    });

    return {
      page: page ?? 1,
      paginations,
      data: series
    };
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
