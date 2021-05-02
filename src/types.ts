export type UrlParamsType = {
  [key: string]: string;
};

export type GoGoAnimeConfig = {
  baseUrl: string;
  recentReleaseUrl: string;
};

export type IPagination<T = unknown> = {
  page: number;
  paginations: Array<number>;
  data: Array<T>;
};

export type IRecentRelease = {
  id: string;
  name: string;
  link: string;
  thumnail: string;
  episode: string;
};
