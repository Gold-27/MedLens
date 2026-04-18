import { Config } from '../config';
import COMMON_DRUGS from '../assets/data/common_drugs.json';

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
  ai_provider?: string;
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

const DEFAULT_TIMEOUT = 20000; // 20 seconds
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
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return { query, suggestions: [] };

  // 1. Local Search First (Instant, Zero API Cost)
  const localSuggestions = (COMMON_DRUGS as any[])
    .filter(d => 
      d.name.toLowerCase().includes(normalizedQuery) || 
      d.drug_name.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 5)
    .map(d => ({
      name: d.name,
      drug_name: d.drug_name,
      type: d.type as 'brand' | 'generic'
    }));

  try {
    // 2. Attempt API Search for more comprehensive results
    const apiResponse = await apiRequest<AutocompleteResponse>(`${Config.ENDPOINTS.AUTOCCOMPLETE}?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
    
    // Merge results, prioritizing local hits but removing duplicates
    const combined = [...localSuggestions];
    apiResponse.suggestions.forEach(apiSug => {
      if (!combined.some(c => c.name.toLowerCase() === apiSug.name.toLowerCase())) {
        combined.push(apiSug);
      }
    });

    return {
      query,
      suggestions: combined.slice(0, 10),
    };
  } catch (error) {
    // 3. Fallback: If offline or API fails, return current local matches
    console.warn('Autocomplete API failed, using local fallback:', error);
    return {
      query,
      suggestions: localSuggestions,
    };
  }
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