import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NativeStack from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type SplashScreenProps = NativeStack.NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const theme = useTheme();
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

    // Check onboarding status and navigate
    const checkOnboardingStatus = async () => {
      try {
        // Clear status so you can preview the new onboarding screen!
        await AsyncStorage.removeItem('hasSeenOnboarding');
        
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Minimum splash time
        
        if (hasSeenOnboarding === 'true') {
          navigation.replace('Home');
        } else {
          navigation.replace('Onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to onboarding on error
        navigation.replace('Onboarding');
      }
    };

    checkOnboardingStatus();
  }, []);

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