export type IUrlParamsType = {
  [key: string]: string | number | undefined;
};

export type IGoGoAnimeConfig = {
  baseUrl: string;
  apiBaseUrl: string;
};

export type IPagination<T = unknown> = {
  page: number;
  paginations: Array<number>;
  data: Array<T>;
};

export type IEntityBasic = {
  id: string;
  title: string;
  link: string;
};

export type IEntity = IEntityBasic & {
  thumbnail: string;
};

export type IAnimeBasic = IEntity & {
  genres: Array<IEntityBasic>;
  released?: string;
  status?: string;
  summary?: string;
};

export type IAnime = IAnimeBasic & {
  movieId: string;
  type?: string;
  otherNames?: Array<string>;
  episodeCount: number;
  episodePages: Array<{ start: number; end: number }>;
};

export type IRecentRelease = IEntity & {
  episode: string;
};

export type IPopularOngoingUpdate = IEntity & {
  genres: Array<IEntityBasic>;
};
