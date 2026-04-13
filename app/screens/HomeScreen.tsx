import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
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
  const { user, isGuest } = useAuth();
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
    if (user) {
      // TODO: Fetch user's saved drugs
      // For now, mock
      setSavedDrugs(new Set(['ibuprofen', 'atorvastatin']));
    }
  }, [user]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setState('loading');
    
    try {
      const response = await api.searchMedication(searchQuery.trim(), eli12Enabled);
      setResult(response);
      setState('success');
    } catch (error: any) {
      console.error('Search error:', error);
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        setState('notFound');
      } else {
        setState('error');
      }
    }
  }, [eli12Enabled]);

  const handleToggleELI12 = useCallback(async (enabled: boolean) => {
    if (!result) return;
    
    setEli12Enabled(enabled);
    setState('loading');
    
    try {
      const response = await api.getELI12(result.drug_name, result);
      setResult(response);
      setState('success');
    } catch (error) {
      console.error('ELI12 toggle error:', error);
      setState('error');
    }
  }, [result]);

  const handleSave = useCallback(() => {
    if (!result) return;
    
    if (isGuest) {
      setPendingAction('save this medication to your cabinet');
      setShowAuthModal(true);
      return;
    }
    
    // TODO: Save to cabinet via API
    Alert.alert('Saved', `${result.drug_name} has been saved to your cabinet.`);
    setSavedDrugs(prev => new Set([...prev, result.drug_name.toLowerCase()]));
  }, [result, isGuest]);

  const handleExport = useCallback(() => {
    if (!result) return;
    
    if (isGuest) {
      setPendingAction('export this summary');
      setShowAuthModal(true);
      return;
    }
    
    // TODO: Implement export/share
    Alert.alert('Export', 'Export functionality will be implemented soon.');
  }, [result, isGuest]);

  const handleAuthSuccess = useCallback(() => {
    if (pendingAction.includes('save') && result) {
      handleSave();
    } else if (pendingAction.includes('export') && result) {
      handleExport();
    }
    setPendingAction('');
  }, [pendingAction, result, handleSave, handleExport]);

  const fetchSuggestions = useCallback(async (suggestionQuery: string): Promise<any[]> => {
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
        
        const summaryProps: SummaryCardProps = {
          drugName: result.drug_name,
          source: result.source,
          sections: {
            whatItDoes: result.summary.what_it_does || null,
            howToTake: result.summary.how_to_take || null,
            warnings: result.summary.warnings || null,
            sideEffects: result.summary.side_effects || null,
          },
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

const makeStyles = (theme: any) => StyleSheet.create({
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