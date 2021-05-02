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

export type IGenre = {
  id: string;
  title: string;
  link: string;
};

export type IRecentRelease = {
  id: string;
  name: string;
  link: string;
  thumnail: string;
  episode: string;
};

export type IPopularOngoingUpdate = {
  id: string;
  name: string;
  link: string;
  thumnail: string;
  genres: Array<IGenre>;
};
