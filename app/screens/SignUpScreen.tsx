import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SignUpScreen = ({ navigation }: { navigation: any }) => {
  const theme = useTheme();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>Sign up to MedLens</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: focusedInput === 'name' ? theme.colors.primaryContainer : theme.colors.surfaceContainer, 
                    color: theme.colors.onSurface,
                    borderColor: focusedInput === 'name' ? theme.colors.primary : theme.colors.outlineVariant 
                  }
                ]}
                placeholder="John Doe"
                placeholderTextColor={theme.colors.outlineVariant}
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: focusedInput === 'email' ? theme.colors.primaryContainer : theme.colors.surfaceContainer, 
                    color: theme.colors.onSurface,
                    borderColor: focusedInput === 'email' ? theme.colors.primary : theme.colors.outlineVariant 
                  }
                ]}
                placeholder="johndoe@gmail.com"
                placeholderTextColor={theme.colors.outlineVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Create Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { 
                      backgroundColor: focusedInput === 'password' ? theme.colors.primaryContainer : theme.colors.surfaceContainer, 
                      color: theme.colors.onSurface,
                      borderColor: focusedInput === 'password' ? theme.colors.primary : theme.colors.outlineVariant 
                    }
                  ]}
                  placeholder="password"
                  placeholderTextColor={theme.colors.outlineVariant}
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons 
                    name={showPassword ? 'visibility' : 'visibility-off'} 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {}}
            >
              <Text style={[styles.submitButtonText, { color: theme.colors.onPrimary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.socialSection}>
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
              <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>or continue with</Text>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            </View>

            <View style={styles.socialButtonsRow}>
              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: theme.colors.surfaceContainerHigh }]}
                onPress={() => {}}
              >
                <Text style={[styles.socialIconText, { color: '#EA4335' }]}>G</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: theme.colors.onSurface }]}
                onPress={() => {}}
              >
                <Text style={[styles.socialIconText, { color: theme.colors.surface }]}></Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              Already have an account? <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Log In</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  formContainer: {
    gap: 20,
    marginBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  submitButton: {
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  socialSection: {
    marginTop: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  socialIconText: {
    fontSize: 24,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});

export default SignUpScreen;
