import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// This layout wraps every screen inside (protected)/
// It checks for a token before showing anything.
// If there is no token, the user gets sent to login.

export default function ProtectedLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkToken() {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        // No token found — send the user to login
        router.replace('/login');
      }

      // Token exists — stop showing the spinner and render the screen
      setChecking(false);
    }

    checkToken();
  }, []);

  // Show a spinner while we check AsyncStorage
  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  // Render whichever screen is inside (protected)/
  return <Slot />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
