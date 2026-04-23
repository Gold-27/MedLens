import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContextType } from '../theme/ThemeProvider';
import { PasswordRequirements as PasswordRequirementsType } from '../utils/validation';

interface PasswordRequirementsProps {
  requirements: PasswordRequirementsType;
  theme: ThemeContextType;
}

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ requirements, theme }) => {
  return (
    <View style={styles.container}>
      <RequirementRow 
        met={requirements.length} 
        label="At least 8 characters long" 
        theme={theme} 
      />
      <RequirementRow 
        met={requirements.uppercase} 
        label="At least one uppercase letter" 
        theme={theme} 
      />
      <RequirementRow 
        met={requirements.lowercase} 
        label="At least one lowercase letter" 
        theme={theme} 
      />
      <RequirementRow 
        met={requirements.number} 
        label="At least one number" 
        theme={theme} 
      />
      <RequirementRow 
        met={requirements.special} 
        label="At least one special character" 
        theme={theme} 
      />
    </View>
  );
};

const RequirementRow = ({ met, label, theme }: { met: boolean; label: string; theme: ThemeContextType }) => (
  <View style={styles.requirementRow}>
    <MaterialIcons
      name={met ? "check-circle" : "radio-button-unchecked"}
      size={16}
      color={met ? theme.colors.success : theme.colors.outlineVariant}
    />
    <Text style={[styles.requirementText, { color: met ? theme.colors.onSurface : theme.colors.onSurfaceVariant }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    gap: 8,
    paddingLeft: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
});

export default PasswordRequirements;
