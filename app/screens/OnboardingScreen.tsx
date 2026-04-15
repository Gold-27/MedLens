import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image, Animated, Easing, ImageSourcePropType } from 'react-native';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import * as NativeStack from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    image: require('../assets/img_onboard1.png'),
  },
  {
    id: '2',
    title: 'Search. Read. Understand with Clarity',
    description: 'Type a medication name and receive a simple summary in seconds, no medical jargon.',
    image: require('../assets/img_onboard2.png'),
  },
  {
    id: '3',
    title: 'Clear, safe, and easy to use for everyone',
    description: 'MedLens simplifies medical information for understanding. It does not replace professional medical advice.',
    image: require('../assets/img_onboard3.png'),
  },
];

type OnboardingScreenProps = NativeStack.NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const AnimatedIllustration = ({ source, style }: { source: ImageSourcePropType; style: any }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.04,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scale]);

  return (
    <Animated.Image
      source={source}
      style={[style, { transform: [{ scale }] }]}
      resizeMode="contain"
    />
  );
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    navigation.replace('Home');
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <AnimatedIllustration source={item.image} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{item.title}</Text>
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>{item.description}</Text>
      </View>
    </View>
  );

  const renderIndicator = (index: number) => (
    <View
      key={index}
      style={[
        styles.indicator,
        { backgroundColor: index === currentIndex ? theme.colors.primary : theme.colors.outlineVariant },
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
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
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
              style={[styles.nextButton, { backgroundColor: theme.colors.primary, flex: 1.2 }]}
              onPress={handleNext}
            >
              <Text style={[styles.nextButtonText, { color: theme.colors.onPrimary }]}>
                Use as Guest
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.signUpButton, { borderColor: theme.colors.primary, flex: 0.8 }]}
              onPress={handleSignUp}
            >
              <Text style={[styles.signUpButtonText, { color: theme.colors.primary }]}>
                Sign Up
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
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  signUpButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;