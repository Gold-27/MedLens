import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList, RootStackParamList } from '../navigation/AppNavigator';

import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import SummaryCard from '../components/SummaryCard';
import Skeleton from '../components/Skeleton';
import InputBar, { InputBarHandle } from '../components/InputBar';
import EmptyState from '../components/EmptyState';
import AuthModal from '../components/AuthModal';
import Disclaimer from '../components/Disclaimer';
import TrustBadges from '../components/TrustBadges';
import * as api from '../services/api';
import { LocalStorageService } from '../services/storage';
import RecentSearches from '../components/RecentSearches';

type AppState = 'empty' | 'loading' | 'success' | 'partial' | 'notFound' | 'error';

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const { user, isGuest, getToken } = useAuth();
  const navigation = (useNavigation as any)() as DrawerNavigationProp<DrawerParamList>;
  const route = useRoute() as { params?: { searchQuery?: string } };
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);

  const [query, setQuery] = useState('');
  const inputBarRef = useRef<InputBarHandle>(null);
  const [state, setState] = useState<AppState>('empty');
  const [result, setResult] = useState<api.SearchResponse | null>(null);
  const [eli12Enabled, setEli12Enabled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');
  const [savedDrugs, setSavedDrugs] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const handleToggleELI12 = useCallback(async (enabled: boolean) => {
    setEli12Enabled(enabled);
    // Persist preference locally
    LocalStorageService.updateSettings({ eli12Enabled: enabled });
    
    if (!result) return;
    
    // Cache logic: If we already have the ELI12 content, just toggle and return
    if (enabled && result.eli12.content) {
      return;
    }

    if (!enabled) return;

    // Only fetch Layer 2 if enabled and we don't have it yet
    setState('loading');
    try {
      if (!result.data) throw new Error('No drug data available');
      const response = await api.getELI12(result.data, result.summary);
      setResult({ ...result, eli12: response.eli12 });
      setState('success');
    } catch (error) {
      setState('error');
    }
  }, [result]);

  // Helper for immediate ELI12 refinement after search selection
  const handleSearchWithEli = async (baseResult: api.SearchResponse) => {
    setState('loading');
    try {
      if (!baseResult.data) return;
      const eliResponse = await api.getELI12(baseResult.data, baseResult.summary);
      setResult({ ...baseResult, eli12: eliResponse.eli12 });
      setEli12Enabled(true);
      setState('success');
    } catch (err) {
      console.error('Initial ELI12 pass failed:', err);
      // Fall back to showing the base result we already have
      setResult(baseResult);
      setState('success');
    }
  };

  const handleSearch = useCallback(async (searchQuery: string, withEli: boolean = false) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setState('loading');
    // REMOVED: setEli12Enabled(false); // Now it's a master toggle, so respect the current state
    
    try {
      // 1. Check Local Cache First (Optimization)
      const cached = await LocalStorageService.getCachedResult(searchQuery.trim());
      if (cached) {
        setResult(cached);
        setState('success');
        
        // If searched via ELI12 button, trigger the refinement using the cached data directly
        if (withEli) {
          if (cached.data) {
            handleSearchWithEli(cached);
          }
        }

        // Update recent searches in background
        const updated = await LocalStorageService.addRecentSearch(searchQuery.trim());
        setRecentSearches(updated);
        return;
      }

      // 2. Fallback to API/DB
      const response = await api.searchMedication(searchQuery.trim(), false); // Backend always returns Layer 1 now
      setResult(response);
      
      // 3. Save to local storage for future use
      await Promise.all([
        LocalStorageService.setCachedResult(searchQuery.trim(), response),
        LocalStorageService.addRecentSearch(searchQuery.trim()).then(updated => setRecentSearches(updated))
      ]);
      
      setState('success');

      // 4. If searched via ELI12 button, trigger refinement using the response directly
      if (withEli) {
        if (response.data) {
          handleSearchWithEli(response);
        } else {
          setState('success');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found') || message.includes('404')) {
        setState('notFound');
      } else {
        setState('error');
      }
    } finally {
      inputBarRef.current?.clear();
    }
  }, [handleToggleELI12]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    // Check for navigation params if we came from drawer search
    const searchQuery = route.params?.searchQuery;
    
    if (searchQuery) {
      console.log(`[Home] Navigation query detected: ${searchQuery}`);
      handleSearch(searchQuery);
      // Clear navigation params to prevent re-triggering on every mount/update
      navigation.setParams({ searchQuery: undefined });
    }
  }, [route.params?.searchQuery, handleSearch, navigation]);

  useEffect(() => {
    // Load local data on mount
    const loadLocalData = async () => {
      const [recent] = await Promise.all([
        LocalStorageService.getRecentSearches(),
      ]);
      setRecentSearches(recent);
    };
    loadLocalData();
  }, []);

  useEffect(() => {
    // Only fetch cabinet data for authenticated users
    if (isGuest || !user) {
      setSavedDrugs(new Set());
      return;
    }

    const initData = async () => {
      try {
        // 1. Initial Load from Cache (Local-First)
        const cached = await LocalStorageService.getCachedCabinet();
        if (cached.length > 0) {
          setSavedDrugs(new Set(cached.map(item => item.drug_name.toLowerCase())));
        }

        // 2. Background Revalidation (SWR)
        const token = await getToken();
        if (token) {
          const response = await api.getCabinetItems(token);
          const drugNames = response.items.map(item => item.drug_name.toLowerCase());
          
          // Update both state and local storage
          setSavedDrugs(new Set(drugNames));
          await LocalStorageService.setCachedCabinet(response.items);
        }
      } catch (error) {
        console.error('Cabinet revalidation failed:', error);
      }
    };
    initData();
  }, [user, isGuest, getToken]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    if (isGuest) { 
      navigation.navigate('SignUp');
      return; 
    }
    try {
      const token = await getToken();
      if (!token) return;
      const drugKey = result.drug_name.toLowerCase().replace(/\s+/g, '-');
      await api.saveCabinetItem(result.drug_name, drugKey, token);
      
      // Update state and refresh cache immediately (Optimistic UI style)
      setSavedDrugs(prev => {
        const next = new Set(prev);
        next.add(result.drug_name.toLowerCase());
        return next;
      });

      // Silently refresh the full cabinet cache in background
      api.getCabinetItems(token).then(resp => {
        LocalStorageService.setCachedCabinet(resp.items);
      }).catch(() => {});

      Alert.alert('Saved', `${result.drug_name} has been saved to your cabinet.`);
      
      // Reset Home screen to empty state after saving
      setState('empty');
      setResult(null);
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save medication. Please check your connection.');
    }
  }, [result, isGuest, getToken]);

  const handleExport = useCallback(async () => {
    if (!result) return;
    if (isGuest) { 
      navigation.navigate('SignUp');
      return; 
    }
    const summary = result.summary;
    const shareContent = `MedLens Summary: ${result.drug_name}\n\n` +
      `WHAT IT DOES:\n${summary.what_it_does}\n\n` +
      `HOW TO TAKE IT:\n${summary.how_to_take}\n\n` +
      `WARNINGS:\n${summary.warnings}\n\n` +
      `POSSIBLE SIDE EFFECTS:\n${summary.side_effects}\n\n` +
      `Source: OpenFDA\n` +
      `MedLens simplifies medical information for understanding. It does not replace professional medical advice.`;
    
    try { await Share.share({ title: `Medication Summary: ${result.drug_name}`, message: shareContent }); }
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
      return response.suggestions || [];
    } catch (error) { return []; }
  }, []);

  const renderContent = () => {
    if (state === 'empty') {
      return null; // Headline is now static in the background
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
              isSaved={savedDrugs.has(result.drug_name.toLowerCase())}
              requiresAuth={isGuest}
            />
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
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Static Background Headline */}
        {state === 'empty' && (
          <View style={styles.staticHeadlineWrapper} pointerEvents="none">
            <Text style={[styles.headlineText, { color: theme.colors.onSurfaceVariant }]}>
              How can I help you with your medication today?
            </Text>
          </View>
        )}

        {/* Top Navigation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={28} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.cabinetPill, { backgroundColor: theme.colors.primaryContainer, borderWidth: 0 }]}
              onPress={() => isGuest ? navigation.navigate('SignUp') : navigation.navigate('Cabinet')}
            >
              <Ionicons name="briefcase" size={18} color={theme.colors.onPrimaryContainer} />
              <Text style={[styles.cabinetText, { color: theme.colors.onPrimaryContainer }]}>Cabinet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileCircle, { backgroundColor: user ? theme.colors.primary : 'transparent', borderWidth: 0 }]}
              onPress={() => navigation.navigate('Settings')}
            >
              {user ? (
                <Text style={[styles.initialsText, { color: theme.colors.onPrimary }]}>
                  {(() => {
                    const name = user.user_metadata?.full_name;
                    if (name) {
                      const parts = name.trim().split(/\s+/);
                      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                      return parts[0][0].toUpperCase();
                    }
                    return user.email?.[0].toUpperCase() || '?';
                  })()}
                </Text>
              ) : (
                <Ionicons name="person-circle" size={32} color={theme.colors.onSurface} />
              )}
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
        <View style={[styles.floatingFooter, { paddingBottom: isKeyboardVisible ? 20 : Math.max(insets.bottom + 20, 32) }]}>
          <InputBar
            ref={inputBarRef}
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
    </View>
  );
};

const makeStyles = (theme: ThemeContextType) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
    justifyContent: 'space-between',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '700',
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
    justifyContent: 'center',
    paddingBottom: 60, // Balance for floating footer
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
    paddingTop: 8,
    backgroundColor: 'transparent',
    gap: 10,
  },
  headlineText: {
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 38,
  },
  staticHeadlineWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
});


export default HomeScreen;
