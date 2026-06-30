import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { API_URL } from '@/constants/api';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Load current user data once.
  useEffect(() => {
    async function loadMe() {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          Alert.alert('Error', data?.message || 'Could not load profile');
          return;
        }

        setEmail(data.user?.email || '');
      } catch {
        Alert.alert('Error', 'Could not load profile');
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, []);

  // Save email and/or password changes.
  async function handleSave() {
    if (!currentPassword) {
      Alert.alert('Missing field', 'Current password is required.');
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      Alert.alert('Password mismatch', 'New password and confirm password must match.');
      return;
    }

    setSaving(true);
    const token = await SecureStore.getItemAsync('token');

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data?.message || 'Could not update profile');
        return;
      }

      // Save the refreshed token if backend returned one.
      if (data?.token) {
        await SecureStore.setItemAsync('token', data.token);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert('Success', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  // Delete this user account.
  async function handleDeleteAccount() {
    if (!currentPassword) {
      Alert.alert('Missing field', 'Enter current password before deleting account.');
      return;
    }

    Alert.alert(
      'Delete account',
      'This will permanently delete your account and AI history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const token = await SecureStore.getItemAsync('token');

            try {
              const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword }),
              });

              const data = await response.json();

              if (!response.ok) {
                Alert.alert('Error', data?.message || 'Could not delete account');
                return;
              }

              await SecureStore.deleteItemAsync('token');
              router.replace('/login');
            } catch {
              Alert.alert('Error', 'Could not delete account');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#E8750A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholder="Your email"
        />

        {/* Current password is required for all sensitive actions */}
        <Text style={styles.label}>Current Password</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          style={styles.input}
          placeholder="Current password"
        />

        {/* Optional password change */}
        <Text style={styles.label}>New Password (optional)</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={styles.input}
          placeholder="New password"
        />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
          style={styles.input}
          placeholder="Confirm new password"
        />

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && { opacity: 0.7 }]}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.deleteBtnText}>Delete Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backText: {
    color: '#374151',
    fontWeight: '600',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveBtn: {
    marginTop: 18,
    backgroundColor: '#E8750A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  deleteBtn: {
    marginTop: 12,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});
