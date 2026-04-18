import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type SettingsItem = 
  | { label: string; value: string; type: 'info' }
  | { label: string; type: 'button'; action?: () => void; content?: string; destructive?: boolean };

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = (useNavigation as any)();
  const { user, signOut, isGuest } = useAuth();
  const [activeAccordion, setActiveAccordion] = React.useState<string | null>(null);

  const toggleAccordion = (label: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveAccordion(prev => prev === label ? null : label);
  };

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
        { 
          label: 'Privacy Policy', 
          type: 'button', 
          content: 'We do not store sensitive health data. All medication information is fetched from OpenFDA in real-time. Your search history is stored locally on your device.' 
        },
        { 
          label: 'Disclaimer', 
          type: 'button', 
          content: 'MedLens simplifies complex medical data for educational purposes. It is not a clinical tool and does not replace professional medical advice, diagnosis, or treatment. Always consult with a licensed healthcare provider.' 
        },
      ],
    },
    {
      title: '',
      items: [
        { label: 'Sign Out', type: 'button', action: handleSignOut, destructive: true },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Settings</Text>
        </View>

      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          {section.title ? (
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              {section.title}
            </Text>
          ) : null}
          <View style={[styles.sectionContent, { backgroundColor: theme.colors.surfaceContainer }]}>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex}>
                {item.type === 'info' ? (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.colors.onSurface }]}>{item.label}</Text>
                    <Text style={[
                      styles.infoValue, 
                      { 
                        color: (item.value === 'Not signed in' || item.value === 'Guest' || item.value === '1.0.0') 
                          ? theme.colors.outline 
                          : theme.colors.onSurfaceVariant 
                      }
                    ]}>
                      {item.value}
                    </Text>
                  </View>
                ) : (
                  <View>
                    <TouchableOpacity
                      style={styles.buttonRow}
                      onPress={() => item.content ? toggleAccordion(item.label) : item.action?.()}
                    >
                      <View style={[styles.buttonRowContent, item.destructive && { justifyContent: 'center' }]}>
                        <Text style={[
                          styles.buttonLabel,
                          { color: item.destructive ? theme.colors.error : theme.colors.primary }
                        ]}>
                          {item.label}
                        </Text>
                        {item.content && (
                          <Ionicons 
                            name={activeAccordion === item.label ? "chevron-up" : "chevron-down"} 
                            size={18} 
                            color={theme.colors.outline} 
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                    
                    {activeAccordion === item.label && item.content && (
                      <View style={[styles.accordionContent, { backgroundColor: theme.colors.surfaceContainerLow }]}>
                        <Text style={[styles.accordionText, { color: theme.colors.onSurfaceVariant }]}>
                          {item.content}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {itemIndex < section.items.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: theme.colors.outlineVariant }]} />
                )}
              </View>
            ))}
            {section.title === 'Account' && isGuest && (
              <>
                <View style={[styles.separator, { backgroundColor: theme.colors.outlineVariant }]} />
                <TouchableOpacity 
                  style={styles.syncCTA} 
                  onPress={() => navigation.navigate('SignUp')}
                >
                  <Ionicons name="sync-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.syncText, { color: theme.colors.primary }]}>
                    Sign in to sync your data
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      ))}

      <View style={[styles.disclaimerContainer, { backgroundColor: theme.colors.accentContainer }]}>
        <Ionicons name="warning-outline" size={20} color={theme.colors.onAccentContainer} style={styles.disclaimerIcon} />
        <Text style={[styles.disclaimerText, { color: theme.colors.onAccentContainer }]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    paddingVertical: 4,
    marginRight: 4,
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
  buttonRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  accordionContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginTop: -8,
  },
  accordionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
  },
  disclaimerContainer: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 40,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disclaimerIcon: {
    opacity: 0.8,
  },
  syncCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  syncText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
});

export default SettingsScreen;