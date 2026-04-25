import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchResponse, CabinetItem } from './api';

const KEYS = {
  RECENT_SEARCHES: 'ml_recent_searches',
  SEARCH_CACHE: 'ml_search_cache_v2_',
  INTERACTION_CACHE: 'ml_interaction_cache_',
  CABINET: 'ml_cabinet',
  SETTINGS: 'ml_settings',
  INTERACTION_COUNT: 'ml_interaction_count',
  ONBOARDING_COMPLETED: 'ml_onboarding_completed',
  HAS_AUTHENTICATED_BEFORE: 'ml_has_authenticated_before',
  PENDING_SEARCH: 'ml_pending_search',
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface AppSettings {
  eli12Enabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export const LocalStorageService = {
  // Recent Searches
  async getRecentSearches(userId?: string | null): Promise<string[]> {
    try {
      const key = userId ? `${KEYS.RECENT_SEARCHES}_${userId}` : `${KEYS.RECENT_SEARCHES}_guest`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async addRecentSearch(query: string, userId?: string | null): Promise<string[]> {
    try {
      const current = await this.getRecentSearches(userId);
      const filtered = current.filter(s => s.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 10);
      const key = userId ? `${KEYS.RECENT_SEARCHES}_${userId}` : `${KEYS.RECENT_SEARCHES}_guest`;
      await AsyncStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  async clearRecentSearches(userId?: string | null): Promise<void> {
    const key = userId ? `${KEYS.RECENT_SEARCHES}_${userId}` : `${KEYS.RECENT_SEARCHES}_guest`;
    await AsyncStorage.removeItem(key);
  },

  // Search Result Caching
  async getCachedResult(drugName: string): Promise<SearchResponse | null> {
    try {
      const key = `${KEYS.SEARCH_CACHE}${drugName.toLowerCase().replace(/\s+/g, '_')}`;
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;

      const { result, timestamp } = JSON.parse(data);
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      return result;
    } catch (e) {
      return null;
    }
  },

  async setCachedResult(drugName: string, result: SearchResponse): Promise<void> {
    try {
      const key = `${KEYS.SEARCH_CACHE}${drugName.toLowerCase().replace(/\s+/g, '_')}`;
      const data = {
        result,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  },

  // Interaction Caching
  async getCachedInteraction(drugKeys: string[]): Promise<any | null> {
    try {
      const sortedKeys = [...drugKeys].sort().join(',');
      const key = `${KEYS.INTERACTION_CACHE}${sortedKeys}`;
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;

      const { response, timestamp } = JSON.parse(data);
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      return response;
    } catch (e) {
      return null;
    }
  },

  async setCachedInteraction(drugKeys: string[], response: any): Promise<void> {
    try {
      const sortedKeys = [...drugKeys].sort().join(',');
      const key = `${KEYS.INTERACTION_CACHE}${sortedKeys}`;
      const data = {
        response,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      const defaultSettings: AppSettings = {
        eli12Enabled: false,
        theme: 'system',
      };
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (e) {
      return { eli12Enabled: false, theme: 'system' };
    }
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },
  
  // Cabinet Data
  async getCachedCabinet(userId?: string | null): Promise<CabinetItem[]> {
    try {
      // Use user-specific key, fallback to guest
      const key = userId ? `${KEYS.CABINET}_${userId}` : `${KEYS.CABINET}_guest`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async setCachedCabinet(items: CabinetItem[], userId?: string | null): Promise<void> {
    try {
      const key = userId ? `${KEYS.CABINET}_${userId}` : `${KEYS.CABINET}_guest`;
      await AsyncStorage.setItem(key, JSON.stringify(items));
    } catch (e) {}
  },

  async clearUserSessionData(userId?: string | null): Promise<void> {
    try {
      const cabinetKey = userId ? `${KEYS.CABINET}_${userId}` : `${KEYS.CABINET}_guest`;
      const searchesKey = userId ? `${KEYS.RECENT_SEARCHES}_${userId}` : `${KEYS.RECENT_SEARCHES}_guest`;
      
      const keysToRemove = [cabinetKey, searchesKey];
      
      // Also attempt to remove legacy global cabinet key just in case
      if (!userId) {
        keysToRemove.push(KEYS.CABINET);
      }

      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`[Storage] Cleared session data for ${userId || 'guest'} (Onboarding & Auth flags preserved)`);
    } catch (e) {
      console.error('[Storage] Failed to clear session data:', e);
    }
  },

  // Stats
  async getInteractionCount(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(KEYS.INTERACTION_COUNT);
      return data ? parseInt(data, 10) : 0;
    } catch (e) {
      return 0;
    }
  },

  async incrementInteractionCount(): Promise<number> {
    try {
      const current = await this.getInteractionCount();
      const updated = current + 1;
      await AsyncStorage.setItem(KEYS.INTERACTION_COUNT, updated.toString());
      return updated;
    } catch (e) {
      return 0;
    }
  },
  
  // Onboarding
  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETED, 'true');
    } catch (e) {}
  },

  async getOnboardingCompleted(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETED);
      return value === 'true';
    } catch (e) {
      return false;
    }
  },

  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.ONBOARDING_COMPLETED);
    } catch (e) {}
  },

  // Authentication History
  async setHasAuthenticatedBefore(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.HAS_AUTHENTICATED_BEFORE, 'true');
    } catch (e) {}
  },

  async getHasAuthenticatedBefore(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(KEYS.HAS_AUTHENTICATED_BEFORE);
      return value === 'true';
    } catch (e) {
      return false;
    }
  },

  // Pending Search Context (for Auth transitions)
  async setPendingSearch(query: string, eli12: boolean, action?: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PENDING_SEARCH, JSON.stringify({ query, eli12, action }));
    } catch (e) {}
  },

  async getPendingSearch(): Promise<{ query: string; eli12: boolean; action?: string } | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_SEARCH);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async clearPendingSearch(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.PENDING_SEARCH);
    } catch (e) {}
  },

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('[Storage] All local storage cleared successfully');
    } catch (e) {
      console.error('[Storage] Failed to clear all local storage:', e);
    }
  },
};
