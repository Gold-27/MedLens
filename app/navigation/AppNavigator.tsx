import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
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
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  Login: undefined;
  Home: undefined;
  Cabinet: undefined;
  Settings: undefined;
  Interaction: { drugKeys?: string[] };
};

export type DrawerParamList = {
  HomeDrawer: undefined;
  CabinetDrawer: undefined;
  SettingsDrawer: undefined;
};

const Stack = (createNativeStackNavigator as any)();
const Drawer = (createDrawerNavigator as any)();

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { signOut, isGuest, user } = useAuth();
  const [history, setHistory] = React.useState<string[]>([]);

  React.useEffect(() => {
    const loadHistory = async () => {
      const searches = await LocalStorageService.getRecentSearches();
      setHistory(searches);
    };
    
    // Refresh history when drawer opens
    const unsubscribe = props.navigation.addListener('drawerOpen', loadHistory);
    loadHistory();
    return unsubscribe;
  }, [props.navigation]);

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
        {!isGuest && (
          <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            {user?.email}
          </Text>
        )}
      </View>

      <View style={styles.historySection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>SEARCH HISTORY</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="time-outline" size={48} color={theme.colors.outlineVariant} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              You do not have any search history yet
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {history.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.historyItem, { borderBottomColor: theme.colors.outlineVariant }]}
                onPress={() => handleHistoryPress(item)}
              >
                <Ionicons name="search-outline" size={20} color={theme.colors.onSurfaceVariant} style={styles.historyIcon} />
                <Text style={[styles.historyText, { color: theme.colors.onSurface }]} numberOfLines={1}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={[styles.logoutText, { color: theme.colors.error }]}>Log Out</Text>
        </TouchableOpacity>
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
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ gestureEnabled: false, headerBackVisible: false }} 
        />
        <Stack.Screen name="Home" component={DrawerNavigator} />
        <Stack.Screen name="Cabinet" component={CabinetScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="Interaction"
          component={InteractionScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  drawerFooter: {
    padding: 24,
    alignItems: 'flex-start',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AppNavigator;