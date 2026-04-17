import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

type SettingsItem = 
  | { label: string; value: string; type: 'info' }
  | { label: string; type: 'button'; action: () => void; destructive?: boolean };

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user, signOut, isGuest } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        try {
          await signOut();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } catch (error) {
          console.error('Sign out error:', error);
          Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
      }},
    ]);
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy Policy', 'We do not store sensitive health data. All drug information is fetched from OpenFDA.');
  };

  const handleDisclaimer = () => {
    Alert.alert('Disclaimer', 'MedLens simplifies medical information for understanding. It does not replace professional medical advice.');
  };

  const sections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        { label: 'Email', value: user?.email || 'Not signed in', type: 'info' },
        { label: 'Account Type', value: isGuest ? 'Guest' : 'Registered User', type: 'info' },
      ],
    },
    {
      title: 'App',
      items: [
        { label: 'Version', value: '1.0.0', type: 'info' },
        { label: 'Privacy Policy', type: 'button', action: handlePrivacy },
        { label: 'Disclaimer', type: 'button', action: handleDisclaimer },
      ],
    },
    {
      title: 'Actions',
      items: [
        { label: 'Sign Out', type: 'button', action: handleSignOut, destructive: true },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Settings</Text>
        </View>

      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            {section.title}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.colors.surfaceContainer }]}>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex}>
                {item.type === 'info' ? (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.colors.onSurface }]}>{item.label}</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.onSurfaceVariant }]}>{item.value}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.buttonRow}
                    onPress={item.action}
                  >
                    <Text style={[
                      styles.buttonLabel,
                      { color: item.destructive ? theme.colors.error : theme.colors.primary }
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                {itemIndex < section.items.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: theme.colors.outlineVariant }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={[styles.disclaimerContainer, { backgroundColor: theme.colors.surfaceContainerLow }]}>
        <Text style={[styles.disclaimerText, { color: theme.colors.onSurfaceVariant }]}>
          MedLens simplifies medical information for understanding. It does not replace professional medical advice.
        </Text>
      </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginHorizontal: 24,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    marginHorizontal: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
  buttonRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
  },
  disclaimerContainer: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 40,
    padding: 20,
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default SettingsScreen;