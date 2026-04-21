import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CabinetItem } from '../services/api';
import * as api from '../services/api';
import { LocalStorageService } from '../services/storage';
import { useAuth } from './AuthContext';

interface CabinetContextType {
  items: CabinetItem[];
  savedDrugNames: Set<string>;
  loading: boolean;
  refreshCabinet: () => Promise<void>;
  addItem: (drugName: string, drugKey: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

const CabinetContext = createContext<CabinetContextType | undefined>(undefined);

export const CabinetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest, getToken } = useAuth();
  const [items, setItems] = useState<CabinetItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived state for O(1) lookups during search
  const savedDrugNames = useMemo(() => 
    new Set(items.map(item => item.drug_name.toLowerCase())),
  [items]);

  const refreshCabinet = useCallback(async () => {
    // Guest users have no cabinet
    if (isGuest || !user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Local-First: Load from cache instantly
      const cached = await LocalStorageService.getCachedCabinet();
      if (cached.length > 0 && items.length === 0) {
        setItems(cached);
      }

      // 2. Background Revalidation: Sync with API
      const token = await getToken();
      if (token) {
        const response = await api.getCabinetItems(token);
        setItems(response.items);
        await LocalStorageService.setCachedCabinet(response.items);
      }
    } catch (error) {
      console.error('[CabinetContext] Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isGuest, getToken]);

  // Initial load and sync on auth change
  useEffect(() => {
    refreshCabinet();
  }, [refreshCabinet]);

  const addItem = useCallback(async (drugName: string, drugKey: string) => {
    if (isGuest || !user) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.saveCabinetItem(drugName, drugKey, token);
      if (response.success) {
        // Update state and cache immediately
        setItems(prev => {
          const updated = [response.item, ...prev];
          LocalStorageService.setCachedCabinet(updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('[CabinetContext] Add failed:', error);
      throw error;
    }
  }, [user, isGuest, getToken]);

  const removeItem = useCallback(async (id: string) => {
    if (isGuest || !user) return;

    // Optimistic Update: Remove from UI immediately
    const previousItems = [...items];
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      LocalStorageService.setCachedCabinet(updated);
      return updated;
    });

    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      const response = await api.deleteCabinetItem(id, token);
      if (!response.success) throw new Error('API delete failed');
      
      console.log(`[CabinetContext] Successfully deleted ${id}`);
    } catch (error) {
      console.error('[CabinetContext] Remove failed, rolling back:', error);
      // Rollback on failure
      setItems(previousItems);
      LocalStorageService.setCachedCabinet(previousItems);
      throw error;
    }
  }, [user, isGuest, getToken, items]);

  return (
    <CabinetContext.Provider value={{ 
      items, 
      savedDrugNames, 
      loading, 
      refreshCabinet, 
      addItem, 
      removeItem 
    }}>
      {children}
    </CabinetContext.Provider>
  );
};

export const useCabinet = () => {
  const context = useContext(CabinetContext);
  if (context === undefined) {
    throw new Error('useCabinet must be used within a CabinetProvider');
  }
  return context;
};
