import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface BadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const Badge: React.FC<BadgeProps> = ({ icon, title, subtitle }) => {
  const theme = useTheme();
  return (
    <View style={[styles.badgeContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer }]}>
        <Ionicons name={icon} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>
      </View>
    </View>
  );
};

const TrustBadges: React.FC = () => {
  return (
    <View style={styles.container}>
      <Badge icon="shield-checkmark" title="Source verified" subtitle="from openFDA" />
      <Badge icon="lock-closed" title="Private & secure" subtitle="data encrypted" />
      <Badge icon="people" title="Trusted by users" subtitle="10k+ downloads" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 10,
  },
  badgeContainer: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  textWrapper: {
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default TrustBadges;
