// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export const Config = {
  API_BASE_URL,
  ENDPOINTS: {
    SEARCH: `${API_BASE_URL}/api/search`,
    ELI12: `${API_BASE_URL}/api/eli12`,
    INTERACTIONS: `${API_BASE_URL}/api/interactions`,
    AUTOCCOMPLETE: `${API_BASE_URL}/api/autocomplete`,
    CABINET_SAVE: `${API_BASE_URL}/api/cabinet/save`,
    CABINET_ITEMS: `${API_BASE_URL}/api/cabinet/items`,
    CABINET_DELETE: (drugKey: string) => `${API_BASE_URL}/api/cabinet/items/${drugKey}`,
  },
  SUPABASE: {
    URL: process.env.SUPABASE_URL || '',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  },
} as const;