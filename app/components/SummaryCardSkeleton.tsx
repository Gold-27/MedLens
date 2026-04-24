import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import Skeleton from './Skeleton';

const SummaryCardSkeleton: React.FC = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const sections = [1, 2, 3, 4];

  return (
    <View style={styles.card}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.titleContainer}>
            <Skeleton width={32} height={32} borderRadius={16} style={styles.drugIcon} />
            <View style={styles.titleTextContainer}>
              <Skeleton width={180} height={24} borderRadius={4} />
              <View style={styles.sourceRow}>
                <Skeleton width={14} height={14} borderRadius={7} />
                <Skeleton width={120} height={12} borderRadius={2} style={{ marginLeft: 4 }} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Accordion Sections Skeleton */}
      <View style={styles.accordionContainer}>
        {sections.map((i) => (
          <View key={i} style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Skeleton width={36} height={36} borderRadius={18} />
                <Skeleton width={140} height={18} borderRadius={4} style={{ marginLeft: 12 }} />
              </View>
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>
            <View style={styles.collapsedContent}>
              <Skeleton width="90%" height={14} borderRadius={2} style={{ marginBottom: 6 }} />
              <Skeleton width="70%" height={14} borderRadius={2} />
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionsRow}>
        <Skeleton width="48%" height={48} borderRadius={16} />
        <Skeleton width="48%" height={48} borderRadius={16} />
      </View>

      {/* Disclaimer Skeleton */}
      <View style={styles.footerDisclaimer}>
        <Skeleton width={20} height={20} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="100%" height={12} borderRadius={2} style={{ marginBottom: 4 }} />
          <Skeleton width="80%" height={12} borderRadius={2} />
        </View>
      </View>
    </View>
  );
};

const makeStyles = (theme: ThemeContextType) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    ...theme.elevation.medium,
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drugIcon: {
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
    gap: 8,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  accordionContainer: {
    gap: 12,
    marginBottom: 24,
  },
  sectionWrapper: {
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsedContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    marginTop: -4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  footerDisclaimer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SummaryCardSkeleton;
