import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface DrugListItemProps {
  name: string;
  description?: string;
  type?: 'brand' | 'generic' | 'saved';
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
}

const DrugListItem: React.FC<DrugListItemProps> = ({
  name,
  description,
  type = 'brand',
  onPress,
  onLongPress,
  selected = false,
}) => {
  const theme = useTheme();

  const typeConfig = {
    brand: { label: 'Brand name', color: theme.colors.primary },
    generic: { label: 'Generic name', color: theme.colors.secondary },
    saved: { label: 'Saved', color: theme.colors.success },
  }[type];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceContainer,
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.name,
              { color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface },
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
            <Text style={styles.typeBadgeText}>{typeConfig.label}</Text>
          </View>
        </View>
        {description && (
          <Text
            style={[
              styles.description,
              { color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant },
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: 68,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default DrugListItem;