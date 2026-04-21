import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, FlatList, Platform, Animated, Keyboard } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Vibration } from 'react-native';

interface Suggestion {
  name: string;
  type: 'brand' | 'generic';
  drug_name: string;
}

export interface InputBarHandle {
  clear: () => void;
}

interface InputBarProps {
  onSubmit: (query: string, withEli?: boolean) => void;
  loading?: boolean;
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  fetchSuggestions?: (query: string) => Promise<Suggestion[]>;
  autoFocus?: boolean;
  eli12Enabled?: boolean;
  onToggleEli12?: (enabled: boolean) => void;
}

const InputBar = React.forwardRef<InputBarHandle, InputBarProps>(({
  onSubmit,
  loading = false,
  onSuggestionSelect,
  fetchSuggestions,
  autoFocus = false,
  eli12Enabled = false,
  onToggleEli12,
}, ref) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputShadow = useRef(new Animated.Value(0)).current;
  const micScale = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const inputRef = useRef<TextInput>(null);

  React.useImperativeHandle(ref, () => ({
    clear: () => {
      setQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      inputRef.current?.blur();
      Keyboard.dismiss();
    }
  }));

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.trim().length >= 1 && fetchSuggestions) {
      debounceTimeout.current = setTimeout(async () => {
        try {
          const results = await fetchSuggestions(query);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    // Voice event listeners
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error('Voice Error:', e);
      setIsListening(false);
    };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const spokenText = e.value[0];
        setQuery(spokenText);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      pulseAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(micScale, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.current.start();
    } else {
      pulseAnimation.current?.stop();
      Animated.spring(micScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [isListening]);

  const toggleListening = async () => {
    if (isListening) {
      try {
        await Voice.stop();
        setIsListening(false);
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        setQuery('');
        await Voice.start('en-US');
        setIsListening(true);
        Vibration.vibrate(50); // Feedback for starting
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = () => {
    if (query.trim() && !loading) {
      onSubmit(query.trim(), eli12Enabled);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion: Suggestion) => {
    if (!suggestion || !suggestion.name) return;
    
    const drugName = suggestion.name.trim();
    setQuery(drugName);
    setShowSuggestions(false);
    Keyboard.dismiss();
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    
    // Trigger immediate search
    if (drugName && !loading) {
      onSubmit(drugName, eli12Enabled);
    }
  };

  const handleFocus = () => {
    Animated.timing(inputShadow, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(inputShadow, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: theme.colors.outlineVariant }]}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons name="search-outline" size={18} color={theme.colors.onSurfaceVariant} style={styles.suggestionIcon} />
      <View>
        <Animated.Text style={[styles.suggestionName, { color: theme.colors.onSurface }]}>
          {item.name}
        </Animated.Text>
        <Animated.Text style={[styles.suggestionType, { color: theme.colors.onSurfaceVariant }]}>
          {item.type === 'brand' ? 'Brand name' : 'Generic name'}
        </Animated.Text>
      </View>
    </TouchableOpacity>
  );

  const shadowOpacity = inputShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.08],
  });

  return (
    <View
      style={styles.container}
    >
      <View style={styles.mainWrapper}>
        <Animated.View 
          style={[
            styles.inputWrapper, 
            { 
              backgroundColor: theme.colors.surface,
              shadowOpacity: shadowOpacity,
              borderColor: query.trim() ? theme.colors.primaryContainer : theme.colors.outlineVariant,
            }
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.colors.onSurface, textAlign: 'left' }]}
            placeholder="Search medication..."
            placeholderTextColor={theme.colors.outlineVariant}
            cursorColor="#000000"
            selectionColor="#000000"
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            editable={!loading}
            returnKeyType="search"
            autoFocus={autoFocus}
          />
          <TouchableOpacity 
            style={styles.micButton} 
            onPress={query.trim() ? handleSubmit : toggleListening}
          >
            <Animated.View style={{ transform: [{ scale: micScale }] }}>
              <Ionicons 
                name={query.trim() ? "send" : (isListening ? "mic" : "mic-outline")} 
                size={22} 
                color={isListening ? theme.colors.primary : theme.colors.onSurfaceVariant} 
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity 
          style={[
            styles.eliButton, 
            { 
              backgroundColor: eli12Enabled ? theme.colors.primary : theme.colors.surface,
              borderColor: theme.colors.primary,
              borderWidth: 1,
              shadowOpacity: eli12Enabled ? 0.2 : 0.05
            }
          ]}
          onPress={() => onToggleEli12?.(!eli12Enabled)}
        >
          {eli12Enabled && (
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.onPrimary} />
          )}
          <Animated.Text style={[
            styles.eliButtonText, 
            { color: eli12Enabled ? theme.colors.onPrimary : theme.colors.primary }
          ]}>
            ELI 12
          </Animated.Text>
        </TouchableOpacity>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={suggestions.length > 3}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  mainWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 99,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
    paddingVertical: 0,
  },
  micButton: {
    padding: 4,
  },
  eliButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  eliButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    maxHeight: 250,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionsList: {
    width: '100%',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: 14,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionType: {
    fontSize: 12,
  },
});

export default InputBar;