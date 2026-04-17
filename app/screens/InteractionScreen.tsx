import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';
import * as ReactNavigation from '@react-navigation/native';
import * as NativeStack from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as api from '../services/api';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';



interface DrugItem {
  id: string;
  name: string;
  key: string;
}

const InteractionScreen: React.FC = () => {
  const theme = useTheme();
  const { user, getToken } = useAuth();
  const route = ReactNavigation.useRoute() as ReactNavigation.RouteProp<RootStackParamList, 'Interaction'>;
  const navigation = ReactNavigation.useNavigation() as NativeStack.NativeStackNavigationProp<RootStackParamList>;
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [availableDrugs, setAvailableDrugs] = useState<DrugItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<api.InteractionResponse | null>(null);

  // Load cabinet items for selection
  useEffect(() => {
    const loadCabinetItems = async () => {
      // If drugKeys provided via params, use those directly — no DB call needed
      const paramDrugKeys = route.params?.drugKeys;
      if (paramDrugKeys && paramDrugKeys.length > 0) {
        const drugItems = paramDrugKeys.map((key: string, index: number) => ({
          id: `param-${index}`,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          key,
        }));
        setAvailableDrugs(drugItems);
        setSelectedDrugs(paramDrugKeys);
        setLoading(false);
        return;
      }
      
      // No user = no cabinet = no DB call needed
      if (!user) {
        setAvailableDrugs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const token = await getToken();
        if (!token) {
          Alert.alert('Error', 'Authentication required.');
          setAvailableDrugs([]);
          setLoading(false);
          return;
        }
        
        const response = await api.getCabinetItems(token);
        const drugItems = response.items.map(item => ({
          id: item.id,
          name: item.drug_name,
          key: item.drug_key,
        }));
        setAvailableDrugs(drugItems);
        
        // Auto-select first two if less than 5 total
        if (drugItems.length >= 2 && drugItems.length <= 5) {
          setSelectedDrugs([drugItems[0].key, drugItems[1].key]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to load drugs:', message);
        Alert.alert('Error', 'Failed to load medications. Please try again.');
        setAvailableDrugs([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadCabinetItems();
  }, [user, getToken, route.params?.drugKeys]);

  const toggleDrug = (key: string) => {
    setSelectedDrugs(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
    setResult(null);
  };

  const handleCheck = useCallback(async () => {
    if (selectedDrugs.length < 2) {
      Alert.alert('Select Medications', 'Please select at least two medications to check interactions.');
      return;
    }

    setChecking(true);
    setResult(null);
    
    try {
      const response = await api.checkInteractions(selectedDrugs);
      setResult(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Interaction check failed:', message);
      Alert.alert('Error', 'Failed to check interactions. Please try again.');
    } finally {
      setChecking(false);
    }
  }, [selectedDrugs]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Interaction Checker</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading medications...
          </Text>
        </View>
      </View>
    );
  }

  if (availableDrugs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Interaction Checker</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Select two or more medications to check for potential interactions
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            No medications available
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {user 
              ? 'Save medications to your cabinet first to check interactions.'
              : 'Sign in and save medications to check interactions.'}
          </Text>
          <TouchableOpacity
            style={[styles.cabinetButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate(user ? 'Cabinet' : 'Settings')}
          >
            <Text style={[styles.cabinetButtonText, { color: theme.colors.onPrimary }]}>
              {user ? 'Go to Cabinet' : 'Go to Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Interaction Checker</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Select two or more medications to check for potential interactions
        </Text>
      </View>

      <View style={styles.drugSelection}>
        <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>Select Medications</Text>
        <View style={styles.drugList}>
          {availableDrugs.map(drug => (
            <TouchableOpacity
              key={drug.id}
              style={[
                styles.drugChip,
                { backgroundColor: selectedDrugs.includes(drug.key) ? theme.colors.primary : theme.colors.surfaceContainer },
              ]}
              onPress={() => toggleDrug(drug.key)}
            >
              <Text style={[
                styles.drugChipText,
                { color: selectedDrugs.includes(drug.key) ? theme.colors.onPrimary : theme.colors.onSurface },
              ]}>
                {drug.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.selectedCount, { color: theme.colors.onSurfaceVariant }]}>
          {selectedDrugs.length} medication{selectedDrugs.length !== 1 ? 's' : ''} selected
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.checkButton,
          { 
            backgroundColor: selectedDrugs.length >= 2 && !checking 
              ? theme.colors.primary 
              : theme.colors.surfaceContainerHigh 
          },
        ]}
        onPress={handleCheck}
        disabled={selectedDrugs.length < 2 || checking}
      >
        {checking ? (
          <ActivityIndicator size="small" color={theme.colors.onPrimary} />
        ) : (
          <Text style={[
            styles.checkButtonText,
            { color: selectedDrugs.length >= 2 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
          ]}>
            Check Interactions
          </Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={[
          styles.resultCard,
          { 
            backgroundColor: result.status === 'potential_interaction' 
              ? theme.colors.errorContainer 
              : theme.colors.surfaceContainer 
          },
        ]}>
          <Text style={[
            styles.resultTitle,
            { 
              color: result.status === 'potential_interaction' 
                ? theme.colors.onErrorContainer 
                : theme.colors.onSurface 
            },
          ]}>
            {result.status === 'potential_interaction' ? 'Potential Interaction' : 'Insufficient Data'}
          </Text>
          <Text style={[
            styles.resultMessage,
            { 
              color: result.status === 'potential_interaction' 
                ? theme.colors.onErrorContainer 
                : theme.colors.onSurfaceVariant 
            },
          ]}>
            {result.message}
          </Text>
          {result.details?.interactions && result.details.interactions.length > 0 && (
            <View style={styles.interactionDetails}>
              <Text style={[styles.detailsTitle, { color: theme.colors.onSurfaceVariant }]}>
                Interaction Details:
              </Text>
              {result.details.interactions.map((interaction, index) => (
                <View key={index} style={styles.interactionItem}>
                  <Text style={[styles.drugKey, { color: theme.colors.onSurface }]}>
                    {interaction.drugKey}:
                  </Text>
                  {interaction.interactions.length > 0 ? (
                    interaction.interactions.map((text, textIndex) => (
                      <Text key={textIndex} style={[styles.interactionText, { color: theme.colors.onSurfaceVariant }]}>
                        • {text}
                      </Text>
                    ))
                  ) : (
                    <Text style={[styles.noInteractionText, { color: theme.colors.onSurfaceVariant }]}>
                      No specific interaction data available.
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.consultButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => Alert.alert(
              'Consult Healthcare Professional', 
              'Always consult a healthcare professional for personalized medical advice about drug interactions.'
            )}
          >
            <Text style={[styles.consultButtonText, { color: theme.colors.onPrimary }]}>
              Consult a Healthcare Professional
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.disclaimerContainer, { backgroundColor: theme.colors.surfaceContainer }]}>
        <Text style={[styles.disclaimerTitle, { color: theme.colors.onSurface }]}>Important Safety Information</Text>
        <Text style={[styles.disclaimerText, { color: theme.colors.onSurfaceVariant }]}>
          MedLens does not provide medical advice. The interaction checker uses data from OpenFDA and may not include all possible interactions. Always consult a healthcare professional before making any changes to your medications.
        </Text>
      </View>
    </ScrollView>
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
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  cabinetButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 160,
  },
  cabinetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  drugSelection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  drugList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  drugChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  drugChipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 14,
  },
  checkButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  interactionDetails: {
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  interactionItem: {
    marginBottom: 16,
  },
  drugKey: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  interactionText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 2,
  },
  noInteractionText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  consultButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  consultButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimerContainer: {
    marginHorizontal: 24,
    marginBottom: 40,
    padding: 20,
    borderRadius: 12,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default InteractionScreen;