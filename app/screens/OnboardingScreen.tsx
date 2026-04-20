import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { Asset } from 'expo-asset';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

// All three images required at module level — bundler resolves them at build time
const IMG1 = require('../assets/img_onboard1.png');
const IMG2 = require('../assets/img_onboard2.png');
const IMG3 = require('../assets/img_onboard3.png');

interface Slide {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Understand your medication instantly',
    description: 'Get clear, plain‑language explanations of prescriptions, dosage, warnings, and side effects.',
    image: IMG1,
  },
  {
    id: '2',
    title: 'Search. Read. Understand with Clarity',
    description: 'Type a medication name and receive a simple summary in seconds, no medical jargon.',
    image: IMG2,
  },
  {
    id: '3',
    title: 'Clear, safe, and easy to use for everyone',
    description: 'MedLens simplifies medical information for understanding. It does not replace professional medical advice.',
    image: IMG3,
  },
];

type OnboardingScreenProps = any;

const { width } = Dimensions.get('window');

// ─── Single slide component ────────────────────────────────────────────────────
const SlideView = ({ item, theme }: { item: Slide; theme: any }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in text + image together immediately on mount
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Gentle floating pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.04,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.slide, { width, opacity }]}>
      <Animated.Image
        source={item.image}
        style={[styles.image, { transform: [{ scale }] }]}
        resizeMode="contain"
        fadeDuration={0}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.inverseSurface }]}>
          {item.title}
        </Text>
        <Text style={[styles.description, { color: theme.colors.outline }]}>
          {item.description}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { continueAsGuest } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [ready, setReady] = useState(false);

  // Preload all images before showing any UI
  useEffect(() => {
    let cancelled = false;

    Asset.loadAsync([IMG1, IMG2, IMG3])
      .catch(() => {/* already bundled locally — safe to ignore */})
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => { cancelled = true; };
  }, []);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleSignUp = async () => {
    try { await AsyncStorage.setItem('hasSeenOnboarding', 'true'); } catch {}
    navigation.replace('SignUp');
  };

  const handleSkip = () => handleFinish();

  const handleLogin = async () => {
    try { await AsyncStorage.setItem('hasSeenOnboarding', 'true'); } catch {}
    navigation.navigate('Login');
  };

  const handleFinish = async () => {
    try { 
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      await continueAsGuest();
    } catch {}
    navigation.replace('Home');
  };

  // Show spinner while images are loading
  if (!ready) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderSlide = ({ item }: { item: Slide }) => (
    <SlideView item={item} theme={theme} />
  );

  const renderIndicator = (index: number) => (
    <View
      key={index}
      style={[
        styles.indicator,
        {
          backgroundColor:
            index === currentIndex
              ? theme.colors.primary
              : theme.colors.outlineVariant,
        },
      ]}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: theme.colors.onSurfaceVariant }]}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.floor(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
      />

      <View style={styles.bottomSection}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => renderIndicator(index))}
        </View>

        {currentIndex === slides.length - 1 ? (
          <View style={styles.finishButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.signUpButton,
                {
                  backgroundColor: theme.colors.primary,
                  width: '100%',
                },
              ]}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={[styles.signUpButtonText, { color: theme.colors.onPrimary }]}>
                Create account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestLinkButton}
              onPress={handleFinish}
            >
              <Text style={[styles.guestLinkText, { color: theme.colors.primary }]}>
                Use as guest
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, { color: theme.colors.onPrimary }]}>
              Next
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    width: width * 0.85,
    height: width * 0.85,
    alignSelf: 'center',
    marginBottom: 30,
  },
  textContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 30,
    height: 130,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 18,
    textAlign: 'left',
    lineHeight: 26,
  },
  bottomSection: {
    paddingHorizontal: 30,
    paddingBottom: 90,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  finishButtonsContainer: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
    width: '100%',
  },
  signUpButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  guestLinkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestLinkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginLinkButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OnboardingScreen;