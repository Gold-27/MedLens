import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Text, StatusBar } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { LocalStorageService } from '../services/storage';
import { SvgXml } from 'react-native-svg';
import { LOGO_SVG } from '../assets/logo_svg';

type SplashScreenProps = any;

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { session, loading: authLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const checkRouting = async () => {
      try {
        // FOR DEVELOPMENT: Reset onboarding so it shows again as requested
        await LocalStorageService.resetOnboarding();
        
        // Minimum visibility time for branding
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const hasCompletedOnboarding = await LocalStorageService.getOnboardingCompleted();
        
        if (hasCompletedOnboarding) {
          if (session?.user?.id) {
            navigation.replace('Home');
          } else {
            navigation.replace('Login');
          }
        } else {
          navigation.replace('Onboarding');
        }
      } catch (error) {
        console.error('[Splash] Routing error:', error);
        navigation.replace('Onboarding');
      }
    };

    if (!authLoading) {
      checkRouting();
    }
  }, [authLoading, session, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primaryContainer }]}>
      <StatusBar barStyle="dark-content" />
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.logoWrapper}>
          <SvgXml xml={LOGO_SVG} width={200} height={100} />
        </View>
      </Animated.View>
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.onPrimaryContainer }]}>
          Your Health Simplified
        </Text>
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;