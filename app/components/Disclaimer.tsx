import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface DisclaimerProps {
  compact?: boolean;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ compact = false }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
        MedLens simplifies medical information for understanding. It does not replace professional medical advice.
      </Text>
      {!compact && (
        <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  compact: {
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginTop: 16,
  },
});

export default Disclaimer;