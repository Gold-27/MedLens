import { Config } from '../config';

export interface SearchResponse {
  drug_name: string;
  source: string;
  data?: DrugData;
  summary: {
    what_it_does: string | null;
    how_to_take: string | null;
    warnings: string | null;
    side_effects: string | null;
  };
  eli12: {
    enabled: boolean;
    content: string | null;
  };
}

export interface AutocompleteResponse {
  query: string;
  suggestions: Array<{
    name: string;
    type: 'brand' | 'generic';
    drug_name: string;
  }>;
}

export interface InteractionResponse {
  status: 'potential_interaction' | 'insufficient_data';
  message: string;
  details?: {
    interactions: Array<{
      drugKey: string;
      interactions: string[];
    }>;
  };
}

export interface CabinetItem {
  id: string;
  user_id: string;
  drug_name: string;
  drug_key: string;
  source: string;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
  deleted_at?: string;
}

export interface DrugData {
  drug_name?: string;
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  warnings?: string[];
  adverse_reactions?: string[];
  [key: string]: unknown;
}

const DEFAULT_TIMEOUT = 8000; // 8 seconds
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    const isAbortError = error instanceof Error && error.name === 'AbortError';

    if (retries > 0 && !isAbortError) {
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(url, options, retries - 1);
    }

    throw error;
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'User-Agent': 'MedLens-App',
    ...options.headers,
  };

  try {
    const response = await fetchWithRetry(endpoint, {
      ...options,
      headers,
    });

    return await response.json();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`API request failed: ${message}`);
  }
}

// Medication search
export async function searchMedication(query: string, eli12Enabled = false): Promise<SearchResponse> {
  return apiRequest<SearchResponse>(Config.ENDPOINTS.SEARCH, {
    method: 'POST',
    body: JSON.stringify({ query, eli12: eli12Enabled }),
  });
}

// Autocomplete suggestions
export async function getAutocomplete(query: string): Promise<AutocompleteResponse> {
  return apiRequest<AutocompleteResponse>(`${Config.ENDPOINTS.AUTOCCOMPLETE}?q=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
}

// ELI12 toggle
export async function getELI12(drugData: DrugData): Promise<SearchResponse> {
  return apiRequest<SearchResponse>(Config.ENDPOINTS.ELI12, {
    method: 'POST',
    body: JSON.stringify({ drug_data: drugData }),
  });
}

// Interaction checker
export async function checkInteractions(drugKeys: string[]): Promise<InteractionResponse> {
  return apiRequest<InteractionResponse>(Config.ENDPOINTS.INTERACTIONS, {
    method: 'POST',
    body: JSON.stringify({ drug_keys: drugKeys }),
  });
}

// Cabinet operations
export async function saveCabinetItem(drugName: string, drugKey: string, token: string): Promise<{ success: boolean; item: CabinetItem }> {
  return apiRequest<{ success: boolean; item: CabinetItem }>(Config.ENDPOINTS.CABINET_SAVE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ drug_name: drugName, drug_key: drugKey }),
  });
}

export async function getCabinetItems(token: string): Promise<{ items: CabinetItem[]; count: number }> {
  return apiRequest<{ items: CabinetItem[]; count: number }>(Config.ENDPOINTS.CABINET_ITEMS, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function deleteCabinetItem(drugKey: string, token: string): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(Config.ENDPOINTS.CABINET_DELETE(drugKey), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}