import { GoGoAnimeConfig } from './types';

export const DEFAULT_CONFIG: GoGoAnimeConfig = {
  baseUrl: 'https://gogoanime.ai',
  recentReleaseUrl: 'https://ajax.gogo-load.com/ajax/page-recent-release.html'
};

export const RECENT_RELEASE_TYPE_SUB = 1;
export const RECENT_RELEASE_TYPE_DUB = 2;
export const RECENT_RELEASE_TYPE_CHINESE = 3;
