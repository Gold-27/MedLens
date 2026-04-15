import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface RecentSearchesProps {
  searches: string[];
  onSearchPress: (query: string) => void;
  onViewAll?: () => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ searches, onSearchPress, onViewAll }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Recent searches</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAll, { color: theme.colors.primary }]}>View all ›</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {searches.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.chip, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}
            onPress={() => onSearchPress(item)}
          >
            <Ionicons name="time-outline" size={16} color={theme.colors.onSurfaceVariant} style={styles.chipIcon} />
            <Text style={[styles.chipText, { color: theme.colors.onSurface }]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RecentSearches;
