import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  pendingAction?: string;
}

type AuthMode = 'signin' | 'signup';

const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSuccess,
  pendingAction,
}) => {
  const theme = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = mode === 'signin'
        ? await signIn(email.trim(), password.trim())
        : await signUp(email.trim(), password.trim());

      if (result.error) {
        Alert.alert('Error', result.error.message || 'Authentication failed. Please try again.');
      } else {
        Alert.alert('Success', mode === 'signin' ? 'Signed in successfully!' : 'Account created successfully!');
        resetForm();
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Auth error:', message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
            {pendingAction && (
              <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                Sign in to {pendingAction}
              </Text>
            )}
          </View>

          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surfaceContainer,
                  color: theme.colors.onSurface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surfaceContainer,
                  color: theme.colors.onSurface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            {mode === 'signup' && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceContainer,
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            )}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={[styles.submitButtonText, { color: theme.colors.onPrimary }]}>
                {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={switchMode} disabled={loading}>
              <Text style={[styles.switchText, { color: theme.colors.primary }]}>
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
            <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              Your data is secure and private. We never share personal information.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  switchText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    paddingTop: 24,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AuthModal;