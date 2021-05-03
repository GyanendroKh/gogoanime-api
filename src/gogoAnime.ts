import axios, { AxiosRequestConfig } from 'axios';
import { Cheerio, load as cheerioLoad } from 'cheerio';
import { DEFAULT_CONFIG } from './constants';
import {
  GoGoAnimeConfig,
  IAnime,
  IEntityBasic,
  IGenre,
  IOnGoingSeries,
  IPagination,
  IPopularOngoingUpdate,
  IRecentlyAdded,
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

      const thumbnail = $(ele).find('div.img a img').attr('src') ?? '';
      const episode = $(ele).find('p.episode').text().trim();

      series.push({
        ...this._getEntityFromA(a),
        thumbnail,
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
      const thumbnail = (() => {
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

      const genres = new Array<IGenre>();

      $(ele)
        .find('p.genres a')
        .each((_, _ele) => {
          genres.push(this._getEntityFromA($(_ele)));
        });

      series.push({ ...this._getEntityFromA(a), thumbnail, genres });
    });

    return {
      page: page ?? 1,
      paginations,
      data: series
    };
  }

  async getRecentlyAdded(
    axiosConfig?: AxiosRequestConfig
  ): Promise<Array<IRecentlyAdded>> {
    const res = await axios.get(this.baseUrl, axiosConfig);
    const $ = cheerioLoad(res.data);

    const series = new Array<IRecentlyAdded>();

    $('div.added_series_body.final ul.listing li').each((_, ele) => {
      const a = $(ele).children('a');

      series.push(this._getEntityFromA(a));
    });

    return series;
  }

  async getOnGoingSeries(
    axiosConfig?: AxiosRequestConfig
  ): Promise<Array<IOnGoingSeries>> {
    const res = await axios.get(this.baseUrl, axiosConfig);
    const $ = cheerioLoad(res.data);

    const series = new Array<IOnGoingSeries>();

    const ongoingDiv = $(
      'section.content_right div.main_body div.anime_name.ongoing'
    );

    ongoingDiv
      .next()
      .find('nav.menu_series.cron ul li')
      .each((_, ele) => {
        const a = $(ele).children('a');

        series.push(this._getEntityFromA(a));
      });

    return series;
  }

  async getGenres(axiosConfig?: AxiosRequestConfig): Promise<Array<IGenre>> {
    const res = await axios.get(this.baseUrl, axiosConfig);
    const $ = cheerioLoad(res.data);

    const genres = new Array<IGenre>();

    $('nav.menu_series.genre ul li').each((_, ele) => {
      const a = $(ele).children('a');

      genres.push(this._getEntityFromA(a));
    });

    return genres;
  }

  async animeListSearchLetters(
    axiosConfig?: AxiosRequestConfig
  ): Promise<Array<IEntityBasic>> {
    const res = await axios.get(
      this.getUrlWithBase('/anime-list.html'),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const letters = new Array<IEntityBasic>();

    $('div.main_body div.list_search ul li.first-char').each((_, ele) => {
      const a = $(ele).children('a');

      const title = a.text().trim();

      letters.push({ ...this._getEntityFromA(a), title });
    });

    return letters;
  }

  async animeList(
    page?: number,
    letter?: string,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IAnime>> {
    const path = letter ?? '/anime-list.html';

    const res = await axios.get(
      this.getUrlWithBase(path, { page: String(page) }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const paginations = new Array<number>();
    const animes = new Array<IAnime>();

    $('.pagination ul.pagination-list li').each((_, ele) => {
      const e = $(ele).children('a');

      const dataPage = e.attr('data-page');
      paginations.push(Number(dataPage));
    });

    $('div.main_body div.anime_list_body ul.listing li').each((_, ele) => {
      const a = $(ele).children('a');
      const { id, link } = this._getEntityFromA(a);

      const $info = cheerioLoad($(ele).attr('title'));

      const thumbnail = $info('div.thumnail_tool img').attr('src') ?? '';
      const infoDiv = $info('div.thumnail_tool').next();

      const title = infoDiv.children('a').text().trim();

      const info: IAnime = {
        id,
        title,
        link,
        thumbnail,
        genres: []
      };

      infoDiv.children('p').each((_, _ele) => {
        const p = $(_ele);
        const type = p
          .children('span')
          .text()
          .replace(':', '')
          .trim()
          .toLowerCase();

        const text = p.text().slice(`${type}:`.length).trim();

        if (type === 'genre') {
          p.children('a').each((_, _e) => {
            info.genres.push(this._getEntityFromA($(_e)));
          });

          return;
        }

        if (type === 'released') {
          info.released = text;
          return;
        }

        if (type === 'status') {
          info.status = text;
          return;
        }

        if (type === 'plot summary') {
          info.summary = text;
          return;
        }
      });

      animes.push(info);
    });

    return {
      page: page ?? 1,
      paginations,
      data: animes
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

  protected _getEntityFromA(a: Cheerio, baseUrl = this.baseUrl): IEntityBasic {
    const href = a.attr('href') ?? '';
    const title = a.attr('title') ?? '';

    const id = getIdFromPath(href);
    const link = new URL(href, baseUrl).toString();

    return {
      id,
      title,
      link
    };
  }
}

export default new GoGoAnime();
