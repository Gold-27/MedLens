import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../services/api';
import { LocalStorageService } from '../services/storage';
import EmptyState from '../components/EmptyState';

interface CabinetItem {
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



const CabinetScreen: React.FC = () => {
  const theme = useTheme();
  const { user, getToken } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState<CabinetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const fetchCabinetItems = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please sign in again.');
        return;
      }
      
      const response = await api.getCabinetItems(token);
      setItems(response.items);
      // Persist to local cache
      await LocalStorageService.setCachedCabinet(response.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch cabinet items:', message);
      Alert.alert('Error', 'Failed to load your cabinet. Please try again.');
    }
  }, [user, getToken]);

  useEffect(() => {
    const initCabinet = async () => {
      if (!user) {
        setLoading(false);
        setItems([]);
        return;
      }

      // 1. Initial Load from Local Cache (Zero-latency)
      const cached = await LocalStorageService.getCachedCabinet();
      if (cached.length > 0) {
        setItems(cached);
        setLoading(false); // Show cached data immediately
      }

      // 2. Background Revalidation
      await fetchCabinetItems();
      setLoading(false);
    };

    initCabinet();
  }, [user, fetchCabinetItems]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    
    setRefreshing(true);
    await fetchCabinetItems();
    setRefreshing(false);
  }, [user, fetchCabinetItems]);

  const handleItemPress = (item: CabinetItem) => {
    // Navigate to Home with this drug pre-selected
    navigation.navigate('Home', { 
      drugKey: item.drug_key,
      drugName: item.drug_name
    });
  };

  const handleDeleteItem = async (item: CabinetItem) => {
    Alert.alert(
      'Remove Medication',
      `Remove ${item.drug_name} from your cabinet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                Alert.alert('Error', 'Authentication required.');
                return;
              }
              
              await api.deleteCabinetItem(item.drug_key, token);
              
              // Update state and cache immediately
              setItems(prev => {
                const updated = prev.filter(i => i.id !== item.id);
                LocalStorageService.setCachedCabinet(updated);
                return updated;
              });
              
              setSelectedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unknown error';
              console.error('Failed to delete item:', message);
              Alert.alert('Error', 'Failed to remove medication. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleCheckInteractions = () => {
    const selectedDrugs = items
      .filter(item => selectedItems.has(item.id))
      .map(item => item.drug_key);
    
    if (selectedDrugs.length < 2) {
      Alert.alert('Select Medications', 'Please select at least two medications to check interactions.');
      return;
    }
    
    // Navigate to Interaction screen with selected drugs
    navigation.navigate('Interaction', { drugKeys: selectedDrugs });
  };

  const renderEmptyState = () => (
    <EmptyState
      type="empty_cabinet"
      title="Your cabinet is empty"
      subtitle="Save medications from search results to see them here"
    />
  );

  const renderItem = ({ item }: { item: CabinetItem }) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer, 
          { 
            backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surfaceContainer,
            borderColor: isSelected ? theme.colors.primary : theme.colors.outlineVariant,
          }
        ]}
        onPress={() => toggleItemSelection(item.id)}
        onLongPress={() => handleDeleteItem(item)}
        delayLongPress={500}
      >
        <View style={styles.itemContent}>
          <Text style={[
            styles.itemName, 
            { color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface }
          ]}>
            {item.drug_name}
          </Text>
          <Text style={[
            styles.itemDate, 
            { color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }
          ]}>
            Added {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity 
            style={styles.openButton}
            onPress={(e) => {
              e.stopPropagation();
              handleItemPress(item);
            }}
          >
            <Text style={[styles.openButtonText, { color: theme.colors.primary }]}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteItem(item);
            }}
          >
            <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>My Cabinet</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading your cabinet...
          </Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>My Cabinet</Text>
        </View>
        <EmptyState
          type="empty_cabinet"
          title="Sign in to access your cabinet"
          subtitle="Save medications from search results to see them here"
          onAction={() => navigation.navigate('Settings')}
          actionLabel="Go to Settings"
        />
      </View>
    );
  }

return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>My Cabinet</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {items.length} medication{items.length !== 1 ? 's' : ''}
            {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}
          </Text>
        </View>

      {items.length > 0 ? (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
          
          {selectedItems.size >= 2 && (
            <TouchableOpacity
              style={[styles.interactionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleCheckInteractions}
            >
              <Text style={[styles.interactionButtonText, { color: theme.colors.onPrimary }]}>
                Check Interactions ({selectedItems.size} medications)
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  openButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  interactionButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  interactionButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CabinetScreen;