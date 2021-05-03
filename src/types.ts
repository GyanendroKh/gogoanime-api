export type UrlParamsType = {
  [key: string]: string;
};

export type GoGoAnimeConfig = {
  baseUrl: string;
  recentReleaseUrl: string;
  popularOngoingUpdateUrl: string;
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

export type IGenre = IEntityBasic;

export type IAnime = IEntity & {
  genres: Array<IGenre>;
  released?: string;
  status?: string;
  summary?: string;
};

export type IRecentRelease = IEntity & {
  episode: string;
};

export type IPopularOngoingUpdate = IEntity & {
  genres: Array<IGenre>;
};

export type IRecentlyAdded = IEntityBasic;

export type IOnGoingSeries = IEntityBasic;
