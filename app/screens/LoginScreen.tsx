import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as NativeStack from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeProvider';

type LoginScreenProps = NativeStack.NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const theme = useTheme();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  const [loading, setLoading] = useState(false);

  const handleBlur = (field: keyof typeof form) => {
    setFocusedInput(null);
    if (form[field].trim() === '') {
      setErrors((prev) => ({ ...prev, [field]: 'Field must not be empty' }));
    }
  };

  const handleChangeText = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, general: '' })); // Clear general error when user types

    if (field === 'email') {
      if (value.trim() === '') {
        setErrors((prev) => ({ ...prev, email: '' }));
      } else {
        const isValidDomain = value.toLowerCase().endsWith('@gmail.com') || 
                              value.toLowerCase().endsWith('@yahoo.com') || 
                              value.toLowerCase().endsWith('@icloud.com');
        if (!isValidDomain) {
          setErrors((prev) => ({ ...prev, email: 'Enter a valid email address' }));
        } else {
          setErrors((prev) => ({ ...prev, email: '' }));
        }
      }
    } else {
      if (value.trim() !== '') {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    }
  };

  const handleLogin = () => {
    // If both fields are empty, do nothing and don't show the general error
    if (!form.email.trim() && !form.password.trim()) {
      return;
    }

    const isEmailValid = form.email.toLowerCase().endsWith('@gmail.com') || 
                         form.email.toLowerCase().endsWith('@yahoo.com') || 
                         form.email.toLowerCase().endsWith('@icloud.com');
    
    if (!form.email || !form.password || !isEmailValid) {
      setErrors((prev) => ({ ...prev, general: 'Invalid email or password' }));
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 3000);
  };

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
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>Log in to MedLens</Text>
          </View>

          <View style={styles.formContainer}>
            {errors.general ? (
              <View style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer }]}>
                <MaterialIcons name="error-outline" size={20} color={theme.colors.error} />
                <Text style={[styles.generalErrorText, { color: theme.colors.error }]}>{errors.general}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: focusedInput === 'email' ? 'transparent' : theme.colors.surfaceContainerLow, 
                    color: focusedInput === 'email' ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                    borderColor: (errors.email || errors.general) ? theme.colors.error : (focusedInput === 'email' ? theme.colors.primaryContainer : theme.colors.outlineVariant)
                  }
                ]}
                placeholder="johndoe@gmail.com"
                placeholderTextColor={theme.colors.outlineVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) => handleChangeText('email', text)}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => handleBlur('email')}
              />
              {errors.email ? (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Enter Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { 
                      backgroundColor: focusedInput === 'password' ? 'transparent' : theme.colors.surfaceContainerLow, 
                      color: focusedInput === 'password' ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                      borderColor: (errors.password || errors.general) ? theme.colors.error : (focusedInput === 'password' ? theme.colors.primaryContainer : theme.colors.outlineVariant)
                    }
                  ]}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.outlineVariant}
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(text) => handleChangeText('password', text)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => handleBlur('password')}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons 
                    name={showPassword ? 'visibility' : 'visibility-off'} 
                    size={20} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.password}</Text>
              ) : null}
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Text style={[styles.submitButtonText, { color: theme.colors.onPrimary }]}>Log In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>Forgot Password?</Text>
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
                <Image 
                  source={require('../assets/google_g_logo.png')} 
                  style={{ width: 28, height: 28 }} 
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: theme.colors.onSurface }]}
                onPress={() => {}}
              >
                <FontAwesome name="apple" size={28} color={theme.colors.surface} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              Don't have an account? <Text style={{ color: theme.colors.primary, fontWeight: '600' }} onPress={() => navigation.navigate('SignUp')}>Sign Up</Text>
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
    paddingTop: 80,
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 8,
  },
  generalErrorText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit',
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
  forgotPassword: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
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
  footer: {
    marginTop: 'auto',
    paddingTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Outfit',
  },
});

export default LoginScreen;
