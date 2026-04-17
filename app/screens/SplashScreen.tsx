import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { Asset } from 'expo-asset';
import { useTheme } from '../theme/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NativeStack from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type SplashScreenProps = NativeStack.NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Preload onboarding images in the background WHILE the splash timer runs.
    // By the time we navigate to Onboarding, images are already in the Expo cache.
    Asset.loadAsync([
      require('../assets/img_onboard1.png'),
      require('../assets/img_onboard2.png'),
      require('../assets/img_onboard3.png'),
    ]).catch(() => {/* silent — local assets always available */});

    // Check onboarding status and navigate
    const checkStatus = async () => {
      try {
        // Wait for auth to initialize
        if (authLoading) return;

        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Minimum splash time (reduced from 5s)
        
        if (user) {
          // If logged in, always go home
          navigation.replace('Home');
        } else if (hasSeenOnboarding === 'true') {
          navigation.replace('Login'); // Changed to Login instead of Home for better UX
        } else {
          navigation.replace('Onboarding');
        }
      } catch (error) {
        console.error('Error checking status:', error);
        navigation.replace('Onboarding');
      }
    };

    if (!authLoading) {
      checkStatus();
    }
  }, [authLoading, user]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/splash-icon.png')} style={styles.logo} />
          <View style={styles.logoTextContainer}>
            <View style={[styles.logoTextLine, { backgroundColor: theme.colors.onPrimary }]} />
            <View style={[styles.logoTextLineShort, { backgroundColor: theme.colors.onPrimary }]} />
          </View>
        </View>
      </Animated.View>
      
      {/* Preload assets for subsequent screens */}
      <View style={{ opacity: 0, position: 'absolute', width: 1, height: 1 }}>
        <Image source={require('../assets/google_g_logo.png')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  logoTextContainer: {
    gap: 8,
  },
  logoTextLine: {
    width: 120,
    height: 12,
    borderRadius: 6,
  },
  logoTextLineShort: {
    width: 80,
    height: 12,
    borderRadius: 6,
  },
});

export default SplashScreen;