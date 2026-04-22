import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, Modal } from 'react-native';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../services/api';
import { CabinetItem } from '../services/api';
import { LocalStorageService } from '../services/storage';
import EmptyState from '../components/EmptyState';
import SummaryCard from '../components/SummaryCard';
import { useCabinet } from '../context/CabinetContext';

const DRUG_DESCRIPTIONS: Record<string, string> = {
  'advil': 'For pain and fever',
  'tylenol': 'Pain reliever and fever reducer',
  'motrin': 'Pain reliever and fever reducer',
  'aspirin': 'Pain reliever and heart health',
  'metformin': 'Blood sugar management',
  'lisinopril': 'Blood pressure management',
  'levothyroxine': 'Thyroid hormone replacement',
  'atorvastatin': 'Cholesterol management',
  'amlodipine': 'Blood pressure management',
  'metoprolol': 'Heart rate and blood pressure',
  'albuterol': 'Rescue inhaler for asthma',
  'omeprazole': 'Acid reflux and heartburn',
  'losartan': 'Blood pressure management',
  'gabapentin': 'Nerve pain and seizures',
  'simvastatin': 'Cholesterol management',
  'zyrtec': 'Allergy relief',
  'benadryl': 'Allergy and sleep aid',
  'lipitor': 'Cholesterol management',
  'amoxicillin': 'Antibiotic for infections',
  'xanax': 'Anxiety and panic disorders',
};

const getDrugDescription = (name: string): string => {
  const lowerName = name.toLowerCase();
  for (const [key, desc] of Object.entries(DRUG_DESCRIPTIONS)) {
    if (lowerName.includes(key)) return desc;
  }
  return 'Commonly used medication';
};

const CabinetScreen: React.FC = () => {
  const theme = useTheme();
  const { user, getToken } = useAuth();
  const navigation = useNavigation() as any;
  const { items, loading: cabinetLoading, removeItem: removeFromCabinet, refreshCabinet, savedDrugNames } = useCabinet();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [selectedDrugSummary, setSelectedDrugSummary] = useState<api.SearchResponse | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const statsCount = await LocalStorageService.getInteractionCount();
      setInteractionCount(statsCount);
    } catch (error) {
      console.error('[Cabinet] Stats fetch failed:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    refreshCabinet(); // Ensure fresh data on mount
  }, [fetchStats, refreshCabinet]);

  const toggleSelection = (drugKey: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(drugKey)) newSet.delete(drugKey);
      else newSet.add(drugKey);
      return newSet;
    });
  };

  const handleCheckNow = () => {
    const selectedKeys = Array.from(selectedItems);
    navigation.navigate('Interaction', { drugKeys: selectedKeys });
  };

  const handleViewDrug = async (itemId: string, drugName: string) => {
    setViewingItemId(itemId);
    setSelectedDrugSummary(null); // Clear previous summary immediately to avoid mapping issues
    try {
      // 1. Check Cache
      const cached = await LocalStorageService.getCachedResult(drugName);
      if (cached) {
        setSelectedDrugSummary(cached);
        setIsModalVisible(true);
        return;
      }

      // 2. Fetch from API
      const response = await api.searchMedication(drugName);
      setSelectedDrugSummary(response);
      
      // 3. Cache it
      await LocalStorageService.setCachedResult(drugName, response);
      
      setIsModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch drug summary:', error);
      Alert.alert('Error', 'Failed to load medication details. Please check your connection.');
    } finally {
      setViewingItemId(null);
    }
  };

  const handleDeleteDrug = async (item: CabinetItem) => {
    Alert.alert(
      'Remove Medication',
      `Are you sure you want to remove ${item.drug_name} from your cabinet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCabinet(item.id);
              console.log(`[Cabinet] Successfully hard deleted ${item.drug_name}`);
            } catch (error) {
              console.error('[Cabinet] Failed to delete drug:', error);
              Alert.alert('Error', 'Failed to remove medication. Please try again.');
            }
          }
        }
      ]
    );
  };

  const showActionMenu = (item: CabinetItem) => {
    Alert.alert(
      item.drug_name,
      'Select an action',
      [
        { 
          text: 'View summary', 
          onPress: () => handleViewDrug(item.id, item.drug_name) 
        },
        { 
          text: 'Delete from cabinet', 
          style: 'destructive',
          onPress: () => handleDeleteDrug(item)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>My Cabinet</Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.colors.outline }]}>
        Your saved medications, always at your fingertips.
      </Text>

      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
          <Text style={[styles.statsValue, { color: theme.colors.primary }]}>{items.length}</Text>
          <Text style={[styles.statsLabel, { color: theme.colors.onSurfaceVariant }]}>Medications saved</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
          <Text style={[styles.statsValue, { color: theme.colors.tertiary }]}>{interactionCount}</Text>
          <Text style={[styles.statsLabel, { color: theme.colors.onSurfaceVariant }]}>Interactions checked</Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={[styles.interactionCard, { backgroundColor: theme.colors.secondaryContainer }]}>
      <Text style={[styles.interactionTitle, { color: theme.colors.onSecondaryContainer }]}>Check for interactions</Text>
      <Text style={[styles.interactionText, { color: theme.colors.onSecondaryContainer }]}>
        Select two or more medications to see if there are known interactions.
      </Text>
      <TouchableOpacity
        style={[
          styles.checkButton,
          { 
            backgroundColor: selectedItems.size >= 2 ? theme.colors.secondary : theme.colors.outlineVariant,
            opacity: selectedItems.size >= 2 ? 1 : 0.6 
          }
        ]}
        disabled={selectedItems.size < 2}
        onPress={handleCheckNow}
      >
        <Text style={[styles.checkButtonText, { color: theme.colors.onSecondary }]}>Check now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: CabinetItem }) => {
    const isSelected = selectedItems.has(item.drug_key);
    return (
      <View style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity 
          style={styles.checkboxArea} 
          onPress={() => toggleSelection(item.drug_key)}
        >
          <View style={[
            styles.customCheckbox, 
            { borderColor: isSelected ? theme.colors.secondary : theme.colors.outline },
            isSelected && { backgroundColor: theme.colors.secondary }
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color={theme.colors.onSecondary} />
            )}
          </View>
        </TouchableOpacity>
        
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.colors.onSurface }]}>{item.drug_name}</Text>
          <Text style={[styles.itemDesc, { color: theme.colors.outline }]}>{getDrugDescription(item.drug_name)}</Text>
        </View>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => showActionMenu(item)}
          disabled={viewingItemId !== null}
        >
          {viewingItemId === item.id ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.outline} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (cabinetLoading && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={items.length > 0 ? renderFooter : null}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={<EmptyState type="empty_cabinet" title="No medications saved" subtitle="Search and save drugs to populate your cabinet." />}
      />

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Medication Summary</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedDrugSummary(null); // Clean up state on dismiss
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[selectedDrugSummary]}
              keyExtractor={(item) => item ? `${item.drug_name}-${item.source}` : 'summary-loading'}
              renderItem={() => selectedDrugSummary ? (
                <View style={styles.cardWrapper}>
                  <SummaryCard
                    drugName={selectedDrugSummary.drug_name}
                    source={selectedDrugSummary.source}
                    sections={{
                      whatItDoes: selectedDrugSummary.summary.what_it_does,
                      howToTake: selectedDrugSummary.summary.how_to_take,
                      warnings: selectedDrugSummary.summary.warnings,
                      sideEffects: selectedDrugSummary.summary.side_effects,
                    }}
                  />
                </View>
              ) : (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.outline }]}>Preparing medication summary...</Text>
                </View>
              )}
              contentContainerStyle={styles.modalScrollContent}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checkboxArea: {
    paddingRight: 16,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 14,
  },
  menuButton: {
    padding: 8,
    marginRight: -4,
  },
  interactionCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    gap: 12,
  },
  interactionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  interactionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  checkButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardWrapper: {
    paddingTop: 8,
  },
  modalLoading: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CabinetScreen;