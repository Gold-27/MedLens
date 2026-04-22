import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchResponse, CabinetItem } from './api';

const KEYS = {
  RECENT_SEARCHES: 'ml_recent_searches',
  SEARCH_CACHE: 'ml_search_cache_',
  INTERACTION_CACHE: 'ml_interaction_cache_',
  CABINET: 'ml_cabinet',
  SETTINGS: 'ml_settings',
  INTERACTION_COUNT: 'ml_interaction_count',
  ONBOARDING_COMPLETED: 'ml_onboarding_completed',
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface AppSettings {
  eli12Enabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export const LocalStorageService = {
  // Recent Searches
  async getRecentSearches(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.RECENT_SEARCHES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async addRecentSearch(query: string): Promise<string[]> {
    try {
      const current = await this.getRecentSearches();
      const filtered = current.filter(s => s.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 10);
      await AsyncStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  async clearRecentSearches(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.RECENT_SEARCHES);
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
  async getCachedCabinet(): Promise<CabinetItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CABINET);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async setCachedCabinet(items: CabinetItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CABINET, JSON.stringify(items));
    } catch (e) {}
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
};
