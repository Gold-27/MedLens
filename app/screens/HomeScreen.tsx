import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import SummaryCard from '../components/SummaryCard';
import Skeleton from '../components/Skeleton';
import InputBar from '../components/InputBar';
import EmptyState from '../components/EmptyState';
import AuthModal from '../components/AuthModal';
import Disclaimer from '../components/Disclaimer';
import TrustBadges from '../components/TrustBadges';
import * as api from '../services/api';

type AppState = 'empty' | 'loading' | 'success' | 'partial' | 'notFound' | 'error';

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const { user, isGuest, getToken } = useAuth();
  const navigation = useNavigation<any>();
  const styles = makeStyles(theme);

  const [query, setQuery] = useState('');
  const [state, setState] = useState<AppState>('empty');
  const [result, setResult] = useState<api.SearchResponse | null>(null);
  const [eli12Enabled, setEli12Enabled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');
  const [savedDrugs, setSavedDrugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initData = async () => {
      try {
        if (user) {
          const token = await getToken();
          if (token) {
            const response = await api.getCabinetItems(token);
            const drugNames = response.items.map(item => item.drug_name.toLowerCase());
            setSavedDrugs(new Set(drugNames));
          }
        }
      } catch (error) {
        console.error('Initial data fetch failed:', error);
      }
    };
    initData();
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
      if (message.includes('not found') || message.includes('404')) {
        setState('notFound');
      } else {
        setState('error');
      }
    }
  }, [eli12Enabled]);

  const handleToggleELI12 = useCallback(async (enabled: boolean) => {
    setEli12Enabled(enabled);
    if (!result) return;
    if (!enabled) { setState('success'); return; }
    setState('loading');
    try {
      if (!result.data) throw new Error('No drug data available');
      const response = await api.getELI12(result.data);
      setResult({ ...result, eli12: response.eli12 });
      setState('success');
    } catch (error) {
      setState('error');
    }
  }, [result]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    if (isGuest) { setPendingAction('save this medication to your cabinet'); setShowAuthModal(true); return; }
    try {
      const token = await getToken();
      if (!token) return;
      const drugKey = result.drug_name.toLowerCase().replace(/\s+/g, '-');
      await api.saveCabinetItem(result.drug_name, drugKey, token);
      Alert.alert('Saved', `${result.drug_name} has been saved to your cabinet.`);
      setSavedDrugs(prev => new Set([...prev, result.drug_name.toLowerCase()]));
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [result, isGuest, getToken]);

  const handleExport = useCallback(async () => {
    if (!result) return;
    if (isGuest) { setPendingAction('export this summary'); setShowAuthModal(true); return; }
    const shareContent = `MedLens Summary: ${result.drug_name}\n\nWhat it does: ${result.summary.what_it_does}\n\nDisclaimer: Not medical advice.`;
    try { await Share.share({ title: result.drug_name, message: shareContent }); }
    catch (error) { console.error('Share failed:', error); }
  }, [result, isGuest]);

  const handleAuthSuccess = useCallback(() => {
    if (pendingAction.includes('save')) handleSave();
    else if (pendingAction.includes('export')) handleExport();
    setPendingAction('');
  }, [pendingAction, result, handleSave, handleExport]);

  const fetchSuggestions = useCallback(async (suggestionQuery: string) => {
    try {
      const response = await api.getAutocomplete(suggestionQuery);
      return response.suggestions;
    } catch (error) { return []; }
  }, []);

  const renderContent = () => {
    if (state === 'empty') {
      return (
        <View style={[styles.emptyContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.headlineText, { color: theme.colors.onBackground }]}>
            Search any medications to get clear answers ?
          </Text>
        </View>
      );
    }

    switch (state) {
      case 'loading':
        return (
          <View style={styles.loadingState}>
            <Skeleton width="60%" height={32} borderRadius={8} />
            <View style={styles.skeletonSpacing} />
            <Skeleton width="100%" height={300} borderRadius={24} />
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
          try { sections = { ...JSON.parse(result.eli12.content) }; } catch (e) {}
        }
        return (
          <View style={styles.resultContainer}>
            <SummaryCard
              drugName={result.drug_name}
              source={result.source}
              sections={sections}
              isEli12={eli12Enabled}
              onSave={handleSave}
              onExport={handleExport}
              onToggleEli12={handleToggleELI12}
              isSaved={savedDrugs.has(result.drug_name.toLowerCase())}
              requiresAuth={isGuest}
            />
            <Disclaimer />
          </View>
        );

      case 'notFound':
      case 'error':
        return (
          <EmptyState
            type={state === 'notFound' ? 'not_found' : 'error'}
            onRetry={() => query.trim() && handleSearch(query)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        {/* Top Navigation */}
        <View style={styles.header}>
          <View />
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.cabinetPill, { backgroundColor: theme.colors.primaryContainer, borderWidth: 0 }]}
              onPress={() => navigation.navigate('Cabinet')}
            >
              <Ionicons name="briefcase" size={18} color={theme.colors.onPrimaryContainer} />
              <Text style={[styles.cabinetText, { color: theme.colors.onPrimaryContainer }]}>Cabinet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileCircle, { backgroundColor: theme.colors.primary, borderWidth: 0 }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="person-circle" size={32} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>

        {/* Floating Bottom Bar */}
        <View style={styles.floatingFooter}>
          <InputBar
            onSubmit={handleSearch}
            loading={state === 'loading'}
            fetchSuggestions={fetchSuggestions}
            eli12Enabled={eli12Enabled}
            onToggleEli12={handleToggleELI12}
          />
        </View>
      </SafeAreaView>

      <AuthModal
        visible={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingAction(''); }}
        onSuccess={handleAuthSuccess}
        pendingAction={pendingAction}
      />
    </KeyboardAvoidingView>
  );
};

const makeStyles = (theme: ThemeContextType) => StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cabinetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cabinetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  resultContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingState: {
    padding: 24,
  },
  skeletonSpacing: {
    height: 20,
  },
  floatingFooter: {
    paddingHorizontal: 0,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: 'transparent',
    gap: 10,
  },
  headlineText: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 38,
  },
});


export default HomeScreen;
