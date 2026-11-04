// Frontend API cache — see cacheConfig.js (TTLs, invalidation map) and
// CACHING.md at the project root for how the team uses it.
export {
  apiKey,
  clearQueryCache,
  fetchQuery,
  getQueryData,
  invalidateAfterMutation,
  invalidateQueries,
  setCacheScope,
  setQueryData,
} from './queryCache';
export { useCachedQuery } from './useCachedQuery';
export {
  CACHE_DEFAULTS,
  CACHE_RULES,
  INVALIDATION_MAP,
  NEVER_CACHE,
  SEND_ACCEPT_LANGUAGE,
  PERSIST_TO_SESSION_STORAGE,
} from './cacheConfig';
