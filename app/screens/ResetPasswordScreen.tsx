import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeContextType } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { getPasswordRequirements, isPasswordValid, PASSWORD_MIN_LENGTH } from '../utils/validation';
import PasswordRequirements from '../components/PasswordRequirements';

type Props = {
  navigation: any;
  route: {
    params: {
      email: string;
    };
  };
};

const ResetPasswordScreen = ({ navigation, route }: Props) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requirements = getPasswordRequirements(password);

  const handleReset = async () => {
    if (!isPasswordValid(password)) {
      setError(`Password does not meet requirements`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await updatePassword(password);
      if (resetError) {
        setError(resetError.message);
      } else {
        Alert.alert(
          'Success',
          'Your password has been successfully reset. Please log in with your new password.',
          [{ text: 'Log In', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>New Password</Text>
            <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              Create a secure new password for your account.
            </Text>
          </View>

          <View style={styles.formContainer}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer }]}>
                <MaterialIcons name="error-outline" size={20} color={theme.colors.error} />
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: focusedInput === 'password' ? 'transparent' : theme.colors.surfaceContainerLow,
                      color: theme.colors.onSurface,
                      borderColor: error ? theme.colors.error : (focusedInput === 'password' ? theme.colors.primaryContainer : theme.colors.outlineVariant),
                      flex: 1,
                    }
                  ]}
                  placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
                  placeholderTextColor={theme.colors.outlineVariant}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </TouchableOpacity>
              </View>
              {(password.length > 0 || focusedInput === 'password') && (
                <PasswordRequirements requirements={requirements} theme={theme} />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: focusedInput === 'confirm' ? 'transparent' : theme.colors.surfaceContainerLow,
                    color: theme.colors.onSurface,
                    borderColor: error ? theme.colors.error : (focusedInput === 'confirm' ? theme.colors.primaryContainer : theme.colors.outlineVariant),
                  }
                ]}
                placeholder="Confirm your new password"
                placeholderTextColor={theme.colors.outlineVariant}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError('');
                }}
                onFocus={() => setFocusedInput('confirm')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Text style={[styles.submitButtonText, { color: theme.colors.onPrimary }]}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: ThemeContextType) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
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
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  submitButton: {
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;
