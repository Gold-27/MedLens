import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Suggestion {
  name: string;
  type: 'brand' | 'generic';
  drug_name: string;
}

interface InputBarProps {
  onSubmit: (query: string) => void;
  loading?: boolean;
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  fetchSuggestions?: (query: string) => Promise<Suggestion[]>;
  autoFocus?: boolean;
  eli12Enabled?: boolean;
  onToggleEli12?: (enabled: boolean) => void;
}

const InputBar: React.FC<InputBarProps> = ({
  onSubmit,
  loading = false,
  onSuggestionSelect,
  fetchSuggestions,
  autoFocus = false,
  eli12Enabled = false,
  onToggleEli12,
}) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputShadow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.trim().length > 1 && fetchSuggestions) {
      debounceTimeout.current = setTimeout(async () => {
        try {
          const results = await fetchSuggestions(query);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
        }
      }, 350);
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

  const handleSubmit = () => {
    if (query.trim() && !loading) {
      onSubmit(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion: Suggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    onSubmit(suggestion.name);
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
    outputRange: [0.08, 0.15],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          <Ionicons name="search" size={20} color={theme.colors.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface }]}
            placeholder="Search medication..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            editable={!loading}
            returnKeyType="search"
            autoFocus={autoFocus}
          />
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic-outline" size={22} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity 
          style={[
            styles.eliButton, 
            { 
              backgroundColor: eli12Enabled ? theme.colors.primary : theme.colors.surfaceContainerHigh,
              shadowOpacity: eli12Enabled ? 0.2 : 0.05
            }
          ]}
          onPress={() => onToggleEli12?.(!eli12Enabled)}
        >
          <MaterialCommunityIcons 
            name="sparkles" 
            size={16} 
            color={eli12Enabled ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} 
          />
          <Animated.Text style={[
            styles.eliButtonText, 
            { color: eli12Enabled ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
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
    elevation: 5,
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