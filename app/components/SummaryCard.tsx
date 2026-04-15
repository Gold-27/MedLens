import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';

export interface SummaryCardProps {
  drugName: string;
  source?: string;
  sections: {
    whatItDoes?: string | null;
    howToTake?: string | null;
    warnings?: string | null;
    sideEffects?: string | null;
  };
  onSave?: () => void;
  onExport?: () => void;
  onToggleEli12?: (enabled: boolean) => void;
  isEli12?: boolean;
  isSaved?: boolean;
  requiresAuth?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  drugName,
  source = 'OpenFDA',
  sections,
  onSave,
  onExport,
  onToggleEli12,
  isEli12 = false,
  isSaved = false,
  requiresAuth = false,
}) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const [eli12Enabled, setEli12Enabled] = useState(isEli12);

  useEffect(() => {
    setEli12Enabled(isEli12);
  }, [isEli12]);

  const handleToggleEli12 = () => {
    const newValue = !eli12Enabled;
    setEli12Enabled(newValue);
    onToggleEli12?.(newValue);
  };

  const handleSave = () => {
    if (requiresAuth) {
      // TODO: Trigger auth modal
    } else {
      onSave?.();
    }
  };

  const handleExport = () => {
    if (requiresAuth) {
      // TODO: Trigger auth modal
    } else {
      onExport?.();
    }
  };

  const renderSection = (title: string, content: string | null | undefined) => {
    if (!content) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.missingDataText}>
            We do not have enough reliable information for this section.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionContent}>{content}</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.drugNameRow}>
          <Text style={styles.drugName}>{drugName}</Text>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceBadgeText}>Source: {source}</Text>
          </View>
        </View>
        
        {/* ELI12 Toggle */}
        <TouchableOpacity
          style={[styles.eli12Toggle, eli12Enabled && styles.eli12ToggleActive]}
          onPress={handleToggleEli12}
        >
          <Text style={styles.eli12ToggleText}>
            {eli12Enabled ? 'ELI12 ON' : 'ELI12 OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sections */}
      <ScrollView style={styles.sectionsContainer} showsVerticalScrollIndicator={false}>
        {renderSection('What it does', sections.whatItDoes)}
        {renderSection('How to take it', sections.howToTake)}
        {renderSection('Warnings', sections.warnings)}
        {renderSection('Side effects', sections.sideEffects)}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={styles.actionButtonText}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.exportButton]}
          onPress={handleExport}
        >
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          MedLens simplifies medical information. It does not replace professional medical advice.
        </Text>
      </View>
    </View>
  );
};

const makeStyles = (theme: ThemeContextType) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.elevation.medium,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  drugNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  drugName: {
    ...theme.typography.headlineSmall,
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  sourceBadge: {
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  sourceBadgeText: {
    ...theme.typography.labelSmall,
    color: theme.colors.onSurfaceVariant,
  },
  eli12Toggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.borderRadius.sm,
  },
  eli12ToggleActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
  eli12ToggleText: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurface,
  },
  sectionsContainer: {
    maxHeight: 400,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  sectionContent: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
    lineHeight: theme.typography.bodyMedium.lineHeight * 1.3,
  },
  missingDataText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  exportButton: {
    backgroundColor: theme.colors.secondary,
    marginLeft: theme.spacing.sm,
  },
  actionButtonText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onPrimary,
  },
  disclaimer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.md,
  },
  disclaimerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default SummaryCard;