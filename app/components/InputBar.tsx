import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

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
}

const InputBar: React.FC<InputBarProps> = ({
  onSubmit,
  loading = false,
  onSuggestionSelect,
  fetchSuggestions,
  autoFocus = false,
}) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { backgroundColor: theme.colors.surfaceContainer }]}
      onPress={() => handleSuggestionPress(item)}
    >
      <Text style={[styles.suggestionName, { color: theme.colors.onSurface }]}>
        {item.name}
      </Text>
      <Text style={[styles.suggestionType, { color: theme.colors.onSurfaceVariant }]}>
        {item.type === 'brand' ? 'Brand name' : 'Generic name'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceContainer,
              color: theme.colors.onSurface,
              borderColor: showSuggestions && suggestions.length > 0 ? theme.colors.primary : theme.colors.outlineVariant,
            },
          ]}
          placeholder="Search for a medication..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          editable={!loading}
          returnKeyType="search"
          autoFocus={autoFocus}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: query.trim() && !loading ? theme.colors.primary : theme.colors.surfaceContainerHigh },
          ]}
          onPress={handleSubmit}
          disabled={!query.trim() || loading}
        >
          <Text style={[
            styles.sendButtonText,
            { color: query.trim() && !loading ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
          ]}>
            {loading ? '...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}>
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
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    marginRight: 12,
  },
  sendButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 16,
    right: 16,
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  suggestionsList: {
    borderRadius: 12,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionType: {
    fontSize: 12,
  },
});

export default InputBar;