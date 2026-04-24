import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import Skeleton from './Skeleton';

const InteractionSkeleton: React.FC = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      {/* Result Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Skeleton width={180} height={24} borderRadius={4} />
          <Skeleton width={60} height={28} borderRadius={14} />
        </View>
        
        <View style={styles.content}>
          <Skeleton width="100%" height={16} borderRadius={4} style={styles.line} />
          <Skeleton width="90%" height={16} borderRadius={4} style={styles.line} />
          <Skeleton width="75%" height={16} borderRadius={4} style={styles.line} />
        </View>

        <View style={styles.detailsContainer}>
          <Skeleton width={120} height={18} borderRadius={4} style={styles.detailTitle} />
          <View style={styles.detailItem}>
            <Skeleton width={80} height={14} borderRadius={4} style={styles.drugKey} />
            <Skeleton width="100%" height={12} borderRadius={4} style={styles.detailLine} />
            <Skeleton width="85%" height={12} borderRadius={4} style={styles.detailLine} />
          </View>
        </View>
      </View>
    </View>
  );
};

const makeStyles = (theme: ThemeContextType) => StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerHighest,
    padding: 24,
    borderRadius: 20,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    marginBottom: 24,
  },
  line: {
    marginBottom: 8,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 20,
  },
  detailTitle: {
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 12,
  },
  drugKey: {
    marginBottom: 8,
  },
  detailLine: {
    marginBottom: 6,
  },
});

export default InteractionSkeleton;
