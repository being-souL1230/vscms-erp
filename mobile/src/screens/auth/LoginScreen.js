import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import { saveSession, saveUser } from '../../core/storage/authStorage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (password && password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: email.trim(),
        password,
      });

      // Backend returns { user } with session cookie in Set-Cookie header
      const { user } = response.data;

      // Extract session token from Set-Cookie header
      const sessionToken = response._sessionToken || null;

      // Save session and user data
      await saveSession(sessionToken, user);

      // Navigation will be handled by App.js checking auth state
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="school" size={48} color={COLORS.textLight} />
          </View>
          <Text style={styles.title}>VSCMS ERP</Text>
          <Text style={styles.subtitle}>College Management System</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.loginText}>Sign in to continue</Text>

          <Input
            label="Email"
            placeholder="Enter your college email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon="mail-outline"
            error={errors.email}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.password}
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.loginButton}
          />

          <View style={styles.demoCredentials}>
            <Text style={styles.demoTitle}>Demo Credentials:</Text>
            <Text style={styles.demoText}>Student: aarav.r@vscms.edu / demo12345</Text>
            <Text style={styles.demoText}>Faculty: tanya.m@vscms.edu / demo12345</Text>
            <Text style={styles.demoText}>Admin: director@vscms.edu / demo12345</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.hero,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingTop: SPACING.xl + 8,
  },
  welcomeText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  loginText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: SPACING.sm,
  },
  demoCredentials: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.sm,
  },
  demoTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  demoText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
});
