import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CabinetScreen from '../screens/CabinetScreen';
import InteractionScreen from '../screens/InteractionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';

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
  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: theme.colors.background }}>
      <View style={styles.drawerHeader}>
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="medical" size={32} color={theme.colors.onPrimary} />
        </View>
        <Text style={[styles.appName, { color: theme.colors.onSurface }]}>MedLens</Text>
        <Text style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>
          Medication made clear
        </Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

const DrawerNavigator: React.FC = () => {
  const theme = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: theme.colors.primaryContainer,
        drawerActiveTintColor: theme.colors.onPrimaryContainer,
        drawerInactiveTintColor: theme.colors.onSurface,
        drawerLabelStyle: { marginLeft: -20, fontSize: 16, fontWeight: '500' },
        drawerStyle: { backgroundColor: theme.colors.background, width: 280 },
      }}
    >
      <Drawer.Screen
        name="HomeDrawer"
        component={HomeScreen}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="CabinetDrawer"
        component={CabinetScreen}
        options={{
          drawerLabel: 'My Cabinet',
          drawerIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="SettingsDrawer"
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="settings-outline" size={size} color={color} />,
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
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
  },
});

export default AppNavigator;