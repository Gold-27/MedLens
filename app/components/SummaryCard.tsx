import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCabinet } from '../context/CabinetContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface SummaryCardProps {
  drugName: string;
  drugKey?: string;
  source?: string;
  sections: {
    whatItDoes?: string | null;
    howToTake?: string | null;
    warnings?: string | null;
    sideEffects?: string | null;
  };
  onSave?: () => void;
  onExport?: () => void;
  isEli12?: boolean;
  isSaved?: boolean;
  requiresAuth?: boolean;
  onClose?: () => void;
  isExporting?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  drugName,
  drugKey,
  source = 'FDA (OpenFDA)',
  sections,
  onSave,
  onExport,
  isEli12 = false,
  isSaved,
  requiresAuth = false,
  onClose,
  isExporting = false,
}) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { savedDrugNames, savedDrugKeys } = useCabinet();
  
  // Real-time check against global cabinet state
  // Prioritize explicit isSaved prop if provided (source of truth from cabinet)
  const isInCabinet = isSaved ?? ((drugKey && savedDrugKeys.has(drugKey.toLowerCase())) || 
                     savedDrugNames.has(drugName.toLowerCase()));

  const [eli12Enabled, setEli12Enabled] = useState(isEli12);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    setEli12Enabled(isEli12);
  }, [isEli12]);

  const toggleSection = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSection(prev => prev === id ? null : id);
  };

  const formatContent = (content: string | null | undefined) => {
    if (!content) return null;

    // Remove any existing bullet point characters to standardize
    const cleanContent = content.replace(/^[•\-\*]\s*/gm, '').trim();
    
    // Split into sentences (simple heuristic)
    const sentences = cleanContent.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    // If it's short (1-2 sentences) and not too long, return as plain text
    if (sentences.length <= 2 && cleanContent.length < 150) {
      return <Text style={styles.sectionContent}>{cleanContent}</Text>;
    }

    // Otherwise, format as bullet points
    return (
      <View style={styles.bulletContainer}>
        {sentences.map((sentence, index) => (
          <View key={index} style={styles.bulletRow}>
            <Text style={[styles.bulletPoint, { color: theme.colors.primary }]}>•</Text>
            <Text style={styles.bulletText}>{sentence.trim()}</Text>
          </View>
        ))}
      </View>
    );
  };

  const sectionConfig = [
    { 
      id: 'whatItDoes', 
      title: 'What it does', 
      content: sections.whatItDoes, 
      icon: 'medical-outline' as const,
      color: theme.colors.successContainer,
      iconColor: theme.colors.onSuccessContainer
    },
    { 
      id: 'howToTake', 
      title: 'How to take it', 
      content: sections.howToTake, 
      icon: 'beaker-outline' as const,
      color: theme.colors.primaryContainer,
      iconColor: theme.colors.onPrimaryContainer
    },
    { 
      id: 'warnings', 
      title: 'Warnings', 
      content: sections.warnings, 
      icon: 'warning-outline' as const,
      color: theme.colors.accentContainer,
      iconColor: theme.colors.onAccentContainer
    },
    { 
      id: 'sideEffects', 
      title: 'Possible side effects', 
      content: sections.sideEffects, 
      icon: 'list-outline' as const,
      color: theme.colors.tertiaryContainer,
      iconColor: theme.colors.onTertiaryContainer
    },
  ];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'column', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="pill" size={28} color={theme.colors.primary} style={styles.drugIcon} />
            <Text style={[styles.drugName, { flex: 1 }]}>{drugName}</Text>
            {onClose && !isExporting && (
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={26} color={theme.colors.outlineVariant} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.sourceRow, { marginLeft: 40 }]}>
            <Ionicons name="shield-checkmark" size={14} color={theme.colors.success} />
            <Text style={styles.sourceText}>Trusted source: {source}</Text>
          </View>
        </View>

        {eli12Enabled && (
          <View style={[styles.eliInfoCard, { backgroundColor: theme.colors.primaryContainer + '40' }]}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <View style={styles.eliInfoTextContainer}>
              <Text style={[styles.eliInfoText, { color: theme.colors.outline }]}>
                Explain Like I'm 12 (ELI12) mode is ON. We've translated complex terms into easy-to-understand language.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Accordion Sections */}
      <View style={styles.accordionContainer}>
        {sectionConfig.map((section) => {
          const isOpen = isExporting || activeSection === section.id;
          return (
            <View key={section.id} style={styles.sectionWrapper}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => !isExporting && toggleSection(section.id)}
                activeOpacity={isExporting ? 1 : 0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View style={[styles.sectionIconBg, { backgroundColor: section.color }]}>
                    <Ionicons name={section.icon} size={20} color={section.iconColor} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: section.iconColor }]}>{section.title}</Text>
                </View>
                {!isExporting && (
                  <Ionicons 
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={section.iconColor} 
                  />
                )}
              </TouchableOpacity>

              {isOpen ? (
                <View style={styles.expandedContent}>
                  {section.content ? formatContent(section.content) : (
                    <Text style={styles.missingDataText}>
                      Section not available for this medication.
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.collapsedContent}>
                   <Text 
                    style={styles.previewText} 
                    numberOfLines={2}
                  >
                    {section.content || ''}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Action Buttons - Hidden during export */}
      {!isExporting && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={onSave}
          >
            <Ionicons name={isInCabinet ? "archive" : "archive-outline"} size={18} color={theme.colors.onPrimary} />
            <Text style={styles.actionButtonText}>
              {isInCabinet ? 'In cabinet' : 'Save to cabinet'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton, { borderColor: theme.colors.outlineVariant, borderWidth: 1 }]}
            onPress={onExport}
          >
            <Ionicons name="share-outline" size={18} color={theme.colors.onSurface} />
            <Text style={[styles.actionButtonText, { color: theme.colors.onSurface }]}>Export summary</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Disclaimer */}
      <View style={[styles.footerDisclaimer, { backgroundColor: theme.colors.accentContainer }]}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.onAccentContainer} />
        <Text style={[styles.footerDisclaimerText, { color: theme.colors.onAccentContainer }]}>
          MedQuire simplifies medical information for understanding. It does not replace professional medical advice.
        </Text>
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
  drugName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.inverseSurface,
    letterSpacing: -0.5,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sourceText: {
    fontSize: 12,
    color: theme.colors.outline,
    fontWeight: '500',
  },
  toggleWrapper: {
    alignItems: 'center',
    marginLeft: 12,
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  eliInfoCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
  },
  eliInfoTextContainer: {
    flex: 1,
  },
  eliInfoText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  learnMore: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  accordionContainer: {
    gap: 12,
    marginBottom: 24,
  },
  sectionWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
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
    gap: 12,
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 8,
  },
  collapsedContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: -4,
  },
  previewText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.outline,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.outline,
  },
  bulletContainer: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletPoint: {
    fontSize: 20,
    lineHeight: 22,
    marginTop: -2,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.outline,
  },
  missingDataText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  saveButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exportButton: {
    backgroundColor: theme.colors.surface,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  footerDisclaimer: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerDisclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 2,
    marginLeft: 8,
  },
});

export default SummaryCard;