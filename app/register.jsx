import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { router, Link } from 'expo-router';

import { API_URL } from '@/constants/api';

export default function RegisterScreen() {
  // --- State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error messages shown under each field
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Error returned from the server (e.g. "Email already in use")
  const [serverError, setServerError] = useState('');

  // True while waiting for the server to respond
  const [loading, setLoading] = useState(false);


  // --- Validation ---
  // Returns true if everything looks good, false if there are errors
  function validate() {
    // Clear any previous errors first
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let isValid = true;

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  }


  // --- Handle register button press ---
  async function handleRegister() {
    // Stop here if validation fails
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      // Send email and password to the backend
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
      });

      const data = await response.json();

      // If the server returned an error (email already exists, etc.)
      if (!response.ok) {
        setServerError(data.message || 'Registration failed. Please try again.');
        return;
      }

      // Registration worked — send the user to the login screen
      router.replace('/login');

    } catch (error) {
      // This runs if the device couldn't reach the server at all
      setServerError('Could not connect to the server. Check your IP in constants/api.js');
    } finally {
      // Always turn off the loading spinner when done
      setLoading(false);
    }
  }


  // --- UI ---
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* Logo */}
      <Image
        source={require('@/assets/images/brokeCook-removebg.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      {/* Email field */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      {/* Password field */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={[styles.input, passwordError ? styles.inputError : null]}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        placeholderTextColor="#aaa"
        secureTextEntry={true}
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      {/* Confirm password field */}
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={[styles.input, confirmPasswordError ? styles.inputError : null]}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Repeat your password"
        placeholderTextColor="#aaa"
        secureTextEntry={true}
      />
      {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

      {/* Server error (shown below the fields) */}
      {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

      {/* Register button */}
      <TouchableOpacity
        style={[styles.button, loading ? styles.buttonDisabled : null]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Create Account</Text>
        }
      </TouchableOpacity>

      {/* Link to Login screen */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/login" style={styles.footerLink}>Log In</Link>
      </View>

    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    width: '100%',
  },
  input: {
    width: '100%',
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    alignSelf: 'flex-start',
    color: '#e53e3e',
    fontSize: 12,
    marginBottom: 10,
  },
  serverError: {
    color: '#e53e3e',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 10,
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 10,
    width: '100%',
  },
  button: {
    width: '100%',
    backgroundColor: '#E8750A',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#E8750A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#f0b07a',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  footerLink: {
    color: '#E8750A',
    fontSize: 14,
    fontWeight: '700',
  },
});
