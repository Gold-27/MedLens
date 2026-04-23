import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export interface ExportSummaryProps {
  drugName: string;
  source?: string;
  isEli12?: boolean;
  sections: {
    whatItDoes?: string | null;
    howToTake?: string | null;
    warnings?: string | null;
    sideEffects?: string | null;
  };
}

const ExportSummary: React.FC<ExportSummaryProps> = ({
  drugName,
  source = 'FDA (OpenFDA)',
  isEli12 = false,
  sections,
}) => {
  const theme = useTheme();
  
  const formatContent = (content: string | null | undefined) => {
    if (!content) return null;

    // Remove any existing bullet point characters to standardize
    const cleanContent = content.replace(/^[•\-\*]\s*/gm, '').trim();
    
    // Split into sentences (simple heuristic)
    const sentences = cleanContent.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    // If it's short (1 sentence) and not too long, return as plain text
    if (sentences.length === 1 && cleanContent.length < 120) {
      return <Text style={styles.sectionContent}>{cleanContent}</Text>;
    }

    // Otherwise, format as compact bullet points
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
    { id: 'whatItDoes', title: 'What it does', content: sections.whatItDoes, color: theme.colors.onSuccessContainer },
    { id: 'howToTake', title: 'How to take it', content: sections.howToTake, color: theme.colors.onPrimaryContainer },
    { id: 'warnings', title: 'Warnings', content: sections.warnings, color: theme.colors.onAccentContainer },
    { id: 'sideEffects', title: 'Possible side effects', content: sections.sideEffects, color: theme.colors.onTertiaryContainer },
  ];

  return (
    <View style={styles.container}>
      {/* Header with Branding and Meta */}
      <View style={styles.docHeader}>
        <View>
          <Text style={styles.docLabel}>MEDICATION SUMMARY REPORT</Text>
          <Text style={styles.docBranding}>PREPARED BY MEDQUIRE AI</Text>
        </View>
        <Text style={styles.docDate}>{new Date().toLocaleDateString()}</Text>
      </View>
      
      <View style={styles.divider} />

      {/* Drug Info Area */}
      <View style={styles.drugHeader}>
        <View style={styles.drugTitleRow}>
          <MaterialCommunityIcons name="pill" size={24} color={theme.colors.primary} />
          <Text style={styles.drugName}>{drugName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.sourceText}>Source: {source}</Text>
          {isEli12 && (
            <View style={[styles.tag, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={[styles.tagText, { color: theme.colors.onPrimaryContainer }]}>ELI12 MODE</Text>
            </View>
          )}
        </View>
      </View>

      {/* Clinical Sections - Compact List */}
      <View style={styles.sectionsContainer}>
        {sectionConfig.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={[styles.sectionTitleRow, { borderLeftColor: section.color }]}>
              <Text style={[styles.sectionTitle, { color: section.color }]}>
                {section.title.toUpperCase()}
              </Text>
            </View>
            <View style={styles.sectionContentWrapper}>
              {section.content ? formatContent(section.content) : (
                <Text style={styles.missingDataText}>Section not available for this medication.</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Professional Footer */}
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle" size={14} color="#64748b" />
          <Text style={styles.disclaimerText}>
            MedQuire simplifies medical information for understanding. This document is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment.
          </Text>
        </View>
        <Text style={styles.legalBranding}>© {new Date().getFullYear()} MedQuire Health Literacy Systems</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 28,
    width: 420, // Slightly wider for document feel
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  docLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1.2,
  },
  docBranding: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  docDate: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#f1f5f9',
    marginBottom: 20,
  },
  drugHeader: {
    marginBottom: 24,
  },
  drugTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  drugName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sectionsContainer: {
    gap: 18,
  },
  section: {
    marginBottom: 2,
  },
  sectionTitleRow: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionContentWrapper: {
    paddingLeft: 13,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  bulletContainer: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: -1,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  missingDataText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 40,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: '#64748b',
    fontStyle: 'italic',
  },
  legalBranding: {
    fontSize: 9,
    fontWeight: '600',
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default ExportSummary;
