import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps, useDrawerStatus } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import { LocalStorageService } from '../services/storage';
import { useNavigation } from '@react-navigation/native';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CabinetScreen from '../screens/CabinetScreen';
import InteractionScreen from '../screens/InteractionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { useAuth } from '../context/AuthContext';
import { CabinetProvider } from '../context/CabinetContext';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  Login: undefined;
  Home: undefined;
  Cabinet: undefined;
  Settings: undefined;
  ForgotPassword: undefined;
  Interaction: { drugKeys?: string[] };
};

export type DrawerParamList = {
  HomeDrawer: { searchQuery?: string };
  CabinetDrawer: undefined;
  SettingsDrawer: undefined;
};

const Stack = (createNativeStackNavigator as any)();
const Drawer = (createDrawerNavigator as any)();

// Global cache to avoid flicker when drawer opens
let drawerHistoryCache: string[] | null = null;

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { signOut, isGuest, user } = useAuth();
  const [history, setHistory] = React.useState<string[] | null>(drawerHistoryCache);
  const [isLoading, setIsLoading] = React.useState(drawerHistoryCache === null);
  const drawerStatus = useDrawerStatus();

  const loadHistory = React.useCallback(async () => {
    try {
      const searches = await LocalStorageService.getRecentSearches();
      setHistory(searches);
      drawerHistoryCache = searches;
    } catch (error) {
      console.error('Failed to load history in drawer:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update history whenever drawer status changes (opening/open)
  React.useEffect(() => {
    if (drawerStatus !== 'closed') {
      loadHistory();
    }
  }, [drawerStatus, loadHistory]);

  React.useEffect(() => {
    // Refresh history when drawer opens explicitly
    const unsubscribe = props.navigation.addListener('drawerOpen', loadHistory);
    // Also refresh on generic state change for maximum reactivity
    const unsubscribeState = props.navigation.addListener('state', loadHistory);
    
    loadHistory();
    return () => {
      unsubscribe();
      unsubscribeState();
    };
  }, [props.navigation, loadHistory]);

  const handleHistoryPress = (query: string) => {
    (navigation as any).navigate('HomeDrawer', { searchQuery: query });
    props.navigation.closeDrawer();
  };

  const clearHistory = async () => {
    await LocalStorageService.clearRecentSearches();
    setHistory([]);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await signOut();
            props.navigation.closeDrawer();
            (navigation as any).reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            console.error('Logout error:', error);
          }
        } 
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.drawerHeader}>
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="medical" size={32} color={theme.colors.onPrimary} />
        </View>
        <Text style={[styles.appName, { color: theme.colors.onSurface }]}>MedLens</Text>
      </View>

      <View style={styles.historySection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>Recent Searches</Text>
          {history && history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading && (!history || history.length === 0) ? (
          <View style={styles.loadingHistory}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.outline }]}>Refreshing...</Text>
          </View>
        ) : !history || history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="time-outline" size={48} color={theme.colors.outlineVariant} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              You do not have any recent searches yet
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {history.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => handleHistoryPress(item)}
              >
                <Text style={[styles.historyText, { color: theme.colors.onSurface }]} numberOfLines={1}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

    </View>
  );
};

const DrawerNavigator: React.FC = () => {
  const theme = useTheme();
  return (
    <Drawer.Navigator
      useLegacyImplementation={false}
      drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: theme.colors.background, width: 300 },
        swipeEnabled: false,
      }}
    >
      <Drawer.Screen
        name="HomeDrawer"
        component={HomeScreen}
        options={{
          drawerLabel: 'Home',
        }}
      />
    </Drawer.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <CabinetProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen 
            name="SignUp" 
            component={SignUpScreen} 
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ gestureEnabled: false, headerBackVisible: false }} 
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen} 
            options={{ presentation: 'push' }} 
          />
          <Stack.Screen name="Home" component={DrawerNavigator} />
          <Stack.Screen name="Cabinet" component={CabinetScreen} />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="Interaction"
            component={InteractionScreen}
            options={{ presentation: 'modal', gestureEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </CabinetProvider>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerText: {
    marginTop: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  historySection: {
    flex: 1,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  historyIcon: {
    marginRight: 16,
  },
  historyText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AppNavigator;