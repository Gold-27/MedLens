import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface SplashScreenProps {
  navigation: any;
}

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

    // Navigate after delay
    const timer = setTimeout(() => {
      // Check if onboarding seen (placeholder)
      const hasSeenOnboarding = false; // TODO: load from AsyncStorage
      if (hasSeenOnboarding) {
        navigation.replace('Main');
      } else {
        navigation.replace('Onboarding');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={styles.logoContainer}>
          {/* Placeholder logo - replace with image */}
          <View style={[styles.logo, { backgroundColor: theme.colors.onPrimary }]} />
          <View style={styles.logoTextContainer}>
            <View style={[styles.logoTextLine, { backgroundColor: theme.colors.onPrimary }]} />
            <View style={[styles.logoTextLineShort, { backgroundColor: theme.colors.onPrimary }]} />
          </View>
        </View>
      </Animated.View>
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