import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MainTabParamList } from '../navigation/AppNavigator';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import SummaryCard, { SummaryCardProps } from '../components/SummaryCard';
import Skeleton from '../components/Skeleton';
import InputBar from '../components/InputBar';
import EmptyState from '../components/EmptyState';
import AuthModal from '../components/AuthModal';
import Disclaimer from '../components/Disclaimer';
import * as api from '../services/api';

type AppState = 'empty' | 'loading' | 'success' | 'partial' | 'notFound' | 'error';

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const { user, isGuest, getToken } = useAuth();
  const navigation = useNavigation();
  const styles = makeStyles(theme);
  
  const [query, setQuery] = useState('');
  const [state, setState] = useState<AppState>('empty');
  const [result, setResult] = useState<api.SearchResponse | null>(null);
  const [eli12Enabled, setEli12Enabled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');
  const [savedDrugs, setSavedDrugs] = useState<Set<string>>(new Set());

  // Fetch cabinet items on mount
  useEffect(() => {
    const fetchCabinetItems = async () => {
      if (!user) {
        setSavedDrugs(new Set());
        return;
      }
      
      try {
        const token = await getToken();
        if (!token) {
          console.warn('No auth token available');
          return;
        }
        
        const response = await api.getCabinetItems(token);
        const drugNames = response.items.map(item => item.drug_name.toLowerCase());
        setSavedDrugs(new Set(drugNames));
      } catch (error) {
        console.error('Failed to fetch cabinet items:', error);
        // Keep existing mock or empty set on error
      }
    };
    
    fetchCabinetItems();
  }, [user, getToken]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setState('loading');
    
    try {
      const response = await api.searchMedication(searchQuery.trim(), eli12Enabled);
      setResult(response);
      setEli12Enabled(response.eli12.enabled);
      setState('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Search error:', message);
      
      if (message.includes('not found') || message.includes('404')) {
        setState('notFound');
      } else {
        setState('error');
      }
    }
  }, [eli12Enabled]);

  const handleToggleELI12 = useCallback(async (enabled: boolean) => {
    if (!result) return;
    
    setEli12Enabled(enabled);
    
    if (!enabled) {
      // Turning off ELI12 - just use existing summary
      setState('success');
      return;
    }
    
    // Turning on ELI12 - fetch simplified summary
    setState('loading');
    
    try {
      if (!result.data) {
        throw new Error('No drug data available for simplification');
      }
      const response = await api.getELI12(result.data);
      // Merge ELI12 response with existing result
      const updatedResult = {
        ...result,
        eli12: response.eli12,
      };
      setResult(updatedResult);
      setState('success');
    } catch (error) {
      console.error('ELI12 toggle error:', error);
      setState('error');
    }
  }, [result]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    
    if (isGuest) {
      setPendingAction('save this medication to your cabinet');
      setShowAuthModal(true);
      return;
    }
    
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please sign in again.');
        return;
      }
      
      // Generate a simple drug key from the name
      const drugKey = result.drug_name.toLowerCase().replace(/\s+/g, '-');
      await api.saveCabinetItem(result.drug_name, drugKey, token);
      
      Alert.alert('Saved', `${result.drug_name} has been saved to your cabinet.`);
      setSavedDrugs(prev => new Set([...prev, result.drug_name.toLowerCase()]));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to save cabinet item:', message);
      Alert.alert('Error', `Failed to save medication: ${message || 'Please try again.'}`);
    }
  }, [result, isGuest, getToken]);

  const handleExport = useCallback(async () => {
    if (!result) return;
    
    if (isGuest) {
      setPendingAction('export this summary');
      setShowAuthModal(true);
      return;
    }
    
    try {
      const shareContent = `
MedLens Medication Summary: ${result.drug_name}

Source: ${result.source}

What it does:
${result.summary.what_it_does || 'No information available.'}

How to take it:
${result.summary.how_to_take || 'No information available.'}

Warnings:
${result.summary.warnings || 'No information available.'}

Side effects:
${result.summary.side_effects || 'No information available.'}

Disclaimer: MedLens simplifies medical information for understanding. It does not replace professional medical advice.
      `.trim();
      
      const resultShare = await Share.share({
        title: `MedLens: ${result.drug_name}`,
        message: shareContent,
      });
      
      if (resultShare.action === Share.sharedAction) {
        // Shared successfully
      } else if (resultShare.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Share failed:', message);
      Alert.alert('Export Failed', 'Could not share the summary. Please try again.');
    }
  }, [result, isGuest]);

  const handleAuthSuccess = useCallback(() => {
    if (pendingAction.includes('save') && result) {
      handleSave();
    } else if (pendingAction.includes('export') && result) {
      handleExport();
    }
    setPendingAction('');
  }, [pendingAction, result, handleSave, handleExport]);

  const fetchSuggestions = useCallback(async (suggestionQuery: string): Promise<api.AutocompleteResponse['suggestions']> => {
    try {
      const response = await api.getAutocomplete(suggestionQuery);
      return response.suggestions;
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }, []);

  const renderContent = () => {
    switch (state) {
      case 'empty':
        return <EmptyState type="initial" />;
      
      case 'loading':
        return (
          <View style={styles.loadingState}>
            <Skeleton width="100%" height={200} borderRadius={16} />
            <View style={styles.skeletonSpacing} />
            <Skeleton width="100%" height={100} borderRadius={16} />
            <View style={styles.skeletonSpacing} />
            <Skeleton width="100%" height={150} borderRadius={16} />
          </View>
        );
      
      case 'success':
      case 'partial':
        if (!result) return null;
        
         let sections = {
           whatItDoes: result.summary.what_it_does || null,
           howToTake: result.summary.how_to_take || null,
           warnings: result.summary.warnings || null,
           sideEffects: result.summary.side_effects || null,
         };
         if (eli12Enabled && result.eli12.content) {
           try {
             const eli12Summary = JSON.parse(result.eli12.content);
             sections = {
               whatItDoes: eli12Summary.whatItDoes || null,
               howToTake: eli12Summary.howToTake || null,
               warnings: eli12Summary.warnings || null,
               sideEffects: eli12Summary.sideEffects || null,
             };
           } catch (e) {
             console.error('Failed to parse ELI12 content', e);
           }
         }
         const summaryProps: SummaryCardProps = {
           drugName: result.drug_name,
           source: result.source,
           sections,
           isEli12: eli12Enabled,
           onSave: handleSave,
           onExport: handleExport,
           onToggleEli12: handleToggleELI12,
           isSaved: savedDrugs.has(result.drug_name.toLowerCase()),
           requiresAuth: isGuest,
         };
        
        return (
          <>
            <SummaryCard {...summaryProps} />
            <Disclaimer />
          </>
        );
      
      case 'notFound':
        return (
          <EmptyState
            type="not_found"
            onRetry={() => query.trim() && handleSearch(query)}
          />
        );
      
      case 'error':
        return (
          <EmptyState
            type="error"
            onRetry={() => query.trim() && handleSearch(query)}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.cabinetButton} onPress={() => navigation.navigate('Cabinet')}>
          <Text style={styles.cabinetButtonText}>Cabinet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.profileIconText}>{user ? '👤' : '👤'}</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Content Area */}
      <ScrollView 
        style={styles.contentArea}
        contentContainerStyle={styles.contentAreaContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {/* Bottom Input Bar */}
      <InputBar
        onSubmit={handleSearch}
        loading={state === 'loading'}
        fetchSuggestions={fetchSuggestions}
      />

      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction('');
        }}
        onSuccess={handleAuthSuccess}
        pendingAction={pendingAction}
      />
    </SafeAreaView>
  );
};

const makeStyles = (theme: ThemeContextType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  cabinetButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.borderRadius.sm,
  },
  cabinetButtonText: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurface,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconText: {
    fontSize: 20,
  },
  contentArea: {
    flex: 1,
    marginBottom: 80, // Space for input bar
  },
  contentAreaContainer: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  loadingState: {
    flex: 1,
  },
  skeletonSpacing: {
    height: theme.spacing.md,
  },
});

export default HomeScreen;