import axios, { AxiosRequestConfig } from 'axios';
import { Cheerio, load as cheerioLoad, Root } from 'cheerio';
import { DEFAULT_CONFIG } from './constants';
import {
  IGoGoAnimeConfig,
  IAnimeBasic,
  IEntity,
  IEntityBasic,
  IPagination,
  IPopularOngoingUpdate,
  IRecentRelease,
  IUrlParamsType,
  IAnime,
  IAnimeEpisodeInfo,
  IEpisodePage,
  IVideoRes
} from './types';
import { getIdFromPath } from './utils';

export default class GoGoAnime {
  /** @internal */
  private readonly baseUrl: string;

  /** @internal */
  private readonly apiBaseUrl: string;

  constructor(config?: IGoGoAnimeConfig) {
    const { baseUrl, apiBaseUrl } = {
      ...DEFAULT_CONFIG,
      ...config
    };

    this.baseUrl = baseUrl;
    this.apiBaseUrl = apiBaseUrl;
  }

  async recentRelease(
    page?: number,
    type?: number,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IRecentRelease>> {
    const res = await axios.get(
      this.getUrlWithApi('/ajax/page-recent-release.html', { page, type }),
      axiosConfig
    );
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

  async popularOnGoingSeries(
    page?: number,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IPopularOngoingUpdate>> {
    const res = await axios.get(
      this.getUrlWithApi('/ajax/page-recent-release-ongoing.html', { page }),
      axiosConfig
    );
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
        const match = style.match(/url\('(.+)'\);/);

        if (match && match[1]) {
          return match[1];
        }

        return '';
      })();

      const a = $(ele).children('a');

      const genres = new Array<IEntityBasic>();

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

  async recentlyAdded(
    axiosConfig?: AxiosRequestConfig
  ): Promise<Array<IEntityBasic>> {
    const res = await axios.get(this.baseUrl, axiosConfig);
    const $ = cheerioLoad(res.data);

    const series = new Array<IEntityBasic>();

    $('div.added_series_body.final ul.listing li').each((_, ele) => {
      const a = $(ele).children('a');

      series.push(this._getEntityFromA(a));
    });

    return series;
  }

  async onGoingSeriesAll(
    axiosConfig?: AxiosRequestConfig
  ): Promise<Array<IEntityBasic>> {
    const res = await axios.get(this.baseUrl, axiosConfig);
    const $ = cheerioLoad(res.data);

    const series = new Array<IEntityBasic>();

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

  async genres(axiosConfig?: AxiosRequestConfig): Promise<Array<IEntityBasic>> {
    const res = await axios.get(this.baseUrl, axiosConfig);
    const $ = cheerioLoad(res.data);

    const genres = new Array<IEntityBasic>();

    $('nav.menu_series.genre ul li').each((_, ele) => {
      const a = $(ele).children('a');

      genres.push(this._getEntityFromA(a));
    });

    return genres;
  }

  async seasons(
    axiosConfig?: AxiosRequestConfig
  ): Promise<Array<IEntityBasic>> {
    const res = await axios.get(this.baseUrl, axiosConfig);
    const $ = cheerioLoad(res.data);

    const seasons = new Array<IEntityBasic>();

    const seasonH2 = $('div.anime_name.new_series h2:contains("Season")');
    seasonH2
      .parent()
      .next()
      .find('ul li a')
      .each((_, ele) => {
        const a = $(ele);

        seasons.push(this._getEntityFromA(a));
      });

    return seasons;
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
  ): Promise<IPagination<IAnimeBasic>> {
    const path = letter ?? '/anime-list.html';

    const res = await axios.get(
      this.getUrlWithBase(path, { page }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const paginations = new Array<number>();
    const animes = new Array<IAnimeBasic>();

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

      const info: IAnimeBasic = {
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

  async animeListByType(
    type: string,
    page = 1,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IEntity>> {
    const res = await axios.get(
      this.getUrlWithBase(`/sub-category/${type}`, { page }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const { data, paginations } = this._getPaginatedAnimeList($);

    return {
      page: page ?? 1,
      paginations,
      data
    };
  }

  async newSeason(
    page?: number,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IEntity>> {
    const res = await axios.get(
      this.getUrlWithBase('/new-season.html', { page }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const { data, paginations } = this._getPaginatedAnimeList($);

    return {
      page: page ?? 1,
      paginations,
      data
    };
  }

  async moviesSearchLetters(
    axiosConfig?: AxiosRequestConfig
  ): Promise<Array<IEntityBasic>> {
    const path = '/anime-movies.html';
    const res = await axios.get(this.getUrlWithBase(path), axiosConfig);
    const $ = cheerioLoad(res.data);

    const letters = new Array<IEntityBasic>();

    $('div.main_body div.list_search ul li.first-char').each((_, ele) => {
      const a = $(ele).children('a');

      const title = a.text().trim();
      const id = (() => {
        if (title.toLowerCase() === 'all') {
          return '';
        }

        if (title === '#') {
          return '0';
        }

        return title;
      })();
      const link = this.getUrlWithBase(path, { aph: id });

      letters.push({ id, title, link });
    });

    return letters;
  }

  async movies(
    page?: number,
    letter?: string,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IEntity>> {
    const res = await axios.get(
      this.getUrlWithBase('/anime-movies.html', {
        page: page,
        aph: letter
      }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const { data, paginations } = this._getPaginatedAnimeList($);

    return {
      page: page ?? 1,
      paginations,
      data
    };
  }

  async popular(
    page?: number,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IEntity>> {
    const res = await axios.get(
      this.getUrlWithBase('/popular.html', {
        page: page
      }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const { paginations, data } = this._getPaginatedAnimeList($);

    return {
      page: page ?? 1,
      paginations,
      data
    };
  }

  async onGoingSeries(
    page = 1,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IEntity>> {
    const res = await axios.get(
      this.getUrlWithBase('/ongoing-anime.html', { page }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const { paginations, data } = this._getPaginatedAnimeList($);

    return {
      page,
      data,
      paginations
    };
  }

  async completed(
    page = 1,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IEntity>> {
    const res = await axios.get(
      this.getUrlWithBase('/completed-anime.html', { page }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const { paginations, data } = this._getPaginatedAnimeList($);

    return {
      page,
      data,
      paginations
    };
  }

  async genreList(
    id: string,
    page = 1,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IEntity>> {
    const res = await axios.get(
      this.getUrlWithBase(`/genre/${id}`, { page }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const { paginations, data } = this._getPaginatedAnimeList($);

    return {
      page,
      data,
      paginations
    };
  }

  async search(
    keyword: string,
    page?: number,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IPagination<IEntity>> {
    const res = await axios.get(
      this.getUrlWithBase('/search.html', { keyword, page }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const { data, paginations } = this._getPaginatedAnimeList($);

    return {
      page: page ?? 1,
      paginations,
      data
    };
  }

  async searchAjax(
    keyword: string,
    axiosConfig?: AxiosRequestConfig
  ): Promise<Array<IEntity>> {
    const res = await axios.get<{ content: string }>(
      this.getUrlWithApi('/site/loadAjaxSearch', { keyword }),
      axiosConfig
    );
    const content = res.data.content.replace(/\\/g, '');
    const $ = cheerioLoad(content);

    const animes = new Array<IEntity>();

    $(
      'div#header_search_autocomplete_body div#header_search_autocomplete_item_'
    ).each((_, ele) => {
      const a = $(ele).children('a');

      const { id, link } = this._getEntityFromA(a);

      const style = a.children('div.thumbnail-recent_search').attr('style');
      const thumbnail = (() => {
        const match = (style ?? '').match(/url\("(.+)"\)/);

        if (match && match[1]) {
          return match[1];
        }

        return '';
      })();

      const title = a.text();

      animes.push({ id, link, title, thumbnail });
    });

    return animes;
  }

  async animeInfo(
    id: string,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IAnime> {
    const link = this.getUrlWithBase(`/category/${id}`);
    const res = await axios.get(link, axiosConfig);
    const $ = cheerioLoad(res.data);

    const animeInfoBody = $('.anime_info_body');
    const animeInfoBodyBg = animeInfoBody.children('.anime_info_body_bg');

    const movieId =
      $('input#movie_id.movie_id[type="hidden"]').attr('value') ?? '';
    const thumbnail = animeInfoBodyBg.children('img').attr('src') ?? '';
    const title = animeInfoBodyBg.children('h1').text().trim();

    const info: IAnime = {
      id,
      link,
      title,
      thumbnail,
      movieId,
      genres: [],
      episodeCount: 0,
      episodePages: []
    };

    animeInfoBodyBg.children('p.type').each((_, ele) => {
      const p = $(ele);

      const type = p
        .children('span')
        .text()
        .replace(':', '')
        .trim()
        .toLowerCase();

      const text = p.text().slice(`${type}:`.length).trim();

      if (type === 'type') {
        info.type = text;
        return;
      }

      if (type === 'plot summary') {
        info.summary = text;
        return;
      }

      if (type === 'genre') {
        p.children('a').each((_, _ele) => {
          info.genres.push(this._getEntityFromA($(_ele)));
        });
        return;
      }

      if (type === 'status') {
        info.status = text;
        return;
      }

      if (type === 'released') {
        info.released = text;
        return;
      }

      if (type === 'other name') {
        info.otherNames = text
          .split(', ')
          .map(t => t.trim())
          .filter(t => t !== '');
        return;
      }
    });

    $('.anime_video_body ul#episode_page li').each((_, ele) => {
      const a = $(ele).children('a');

      const start = Number(a.attr('ep_start'));
      const end = Number(a.attr('ep_end'));

      info.episodePages.push({ start, end });
    });

    info.episodePages.forEach(d => {
      if (d.end > info.episodeCount) {
        info.episodeCount = d.end;
      }
    });

    return info;
  }

  async animeEpisodes(
    movieId: string,
    start: number,
    end: number,
    axiosConfig?: AxiosRequestConfig
  ): Promise<Array<IEntityBasic>> {
    const res = await axios.get(
      this.getUrlWithApi('/ajax/load-list-episode', {
        id: movieId,
        default_ep: 0,
        ep_start: start,
        ep_end: end
      }),
      axiosConfig
    );
    const $ = cheerioLoad(res.data);

    const episodes = new Array<IEntityBasic>();

    $('ul#episode_related li').each((_, ele) => {
      const a = $(ele).children('a');

      const title = a.children('.name').text().trim();

      episodes.push({ ...this._getEntityFromA(a), title });
    });

    return episodes;
  }

  async animeEpisodeInfo(
    id: string,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IAnimeEpisodeInfo> {
    const link = this.getUrlWithBase(`/${id}`);
    const res = await axios.get(link, axiosConfig);
    const $ = cheerioLoad(res.data);

    const anime = this._getEntityFromA(
      $('div.anime_video_body div.anime_video_body_cate div.anime-info a')
    );
    const movieId =
      $('input[type="hidden"]#movie_id.movie_id').attr('value') ?? '';
    const episode = Number(
      $('input[type="hidden"]#default_ep.default_ep').attr('value') ?? '-1'
    );

    const src = $('.play-video iframe').attr('src') ?? '';

    const videoId = (() => {
      const matches = src.match(/id=(\w+)/);

      if (matches && matches[1]) {
        return matches[1];
      }

      return '';
    })();

    const episodePages = new Array<IEpisodePage>();
    let episodeCount = 0;

    $('.anime_video_body ul#episode_page li').each((_, ele) => {
      const a = $(ele).children('a');

      const start = Number(a.attr('ep_start'));
      const end = Number(a.attr('ep_end'));

      episodePages.push({ start, end });
    });

    episodePages.forEach(d => {
      if (d.end > episodeCount) {
        episodeCount = d.end;
      }
    });

    return {
      id,
      link,
      anime,
      movieId,
      videoId,
      episode,
      episodeCount,
      episodePages
    };
  }

  async animeEpisodeVideo(
    videoId: string,
    axiosConfig?: AxiosRequestConfig
  ): Promise<IVideoRes> {
    const link = this.getUrl('https://gogo-play.net', '/ajax.php', {
      id: videoId,
      refer: this.baseUrl
    });
    const res = await axios.get<IVideoRes>(link, {
      ...axiosConfig,
      headers: {
        ...axiosConfig?.headers,
        referer: `https://gogo-play.net/streaming.php?id=${videoId}`,
        'user-agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
      }
    });

    return res.data;
  }

  /** @ignore */
  getUrlWithBase(path: string, params?: IUrlParamsType): string {
    return this.getUrl(this.baseUrl, path, params);
  }

  /** @ignore */
  getUrlWithApi(path: string, params?: IUrlParamsType): string {
    return this.getUrl(this.apiBaseUrl, path, params);
  }

  /** @ignore */
  getUrl(base: string, path: string, params?: IUrlParamsType): string {
    const url = new URL(path, base);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /** @ignore */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** @internal */
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

  /** @internal */
  protected _getPaginatedAnimeList(
    $: Root
  ): Omit<IPagination<IEntity>, 'page'> {
    const paginations = new Array<number>();
    const data = new Array<IEntity>();

    $('div.anime_name_pagination div.pagination ul.pagination-list li').each(
      (_, ele) => {
        const a = $(ele).children('a');

        const number = a.data('page');

        paginations.push(number);
      }
    );

    $('div.last_episodes ul.items li').each((_, ele) => {
      const a = $(ele).find('p.name a');
      const thumbnail = $(ele).find('div.img a img').attr('src') ?? '';

      data.push({ ...this._getEntityFromA(a), thumbnail });
    });

    return {
      data,
      paginations
    };
  }
}
