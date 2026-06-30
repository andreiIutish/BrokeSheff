import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { API_URL } from '@/constants/api';

// Read the saved auth token from SecureStore.
export async function getAuthToken() {
  const token = await SecureStore.getItemAsync('token');
  return token || null;
}

// Redirect to login if the token does not exist.
export async function requireAuthToken(router) {
  const token = await getAuthToken();
  if (!token) {
    router.replace('/login');
    return null;
  }
  return token;
}

// Make uploaded images smaller before sending them to Gemini.
export async function shrinkImage(asset) {
  if (!asset?.uri) return asset;

  const result = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 960 } }],
    {
      compress: 0.45,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return {
    ...asset,
    uri: result.uri,
    mimeType: 'image/jpeg',
  };
}

// Pick an image, check permission, then shrink it.
async function pickImage(source) {
  const isCamera = source === 'camera';
  const permission = isCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Permission', isCamera ? 'Please allow camera access.' : 'Please allow photo library access.');
    return null;
  }

  const result = isCamera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.45, allowsEditing: false })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.45, allowsEditing: false });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  return shrinkImage(result.assets[0]);
}

// Open the camera.
export function pickCameraImage() {
  return pickImage('camera');
}

// Open the photo library.
export function pickGalleryImage() {
  return pickImage('gallery');
}

// Small wrapper around fetch that always returns response + parsed JSON.
export async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  return { response, data };
}

// Load the chat list for the current user.
export async function loadChats(token) {
  return fetchJson(`${API_URL}/recipe/chat`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Load one chat by id.
export async function loadChat(token, chatId) {
  return fetchJson(`${API_URL}/recipe/chat/${chatId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Build the form data used by both start-chat and follow-up chat requests.
function buildChatFormData({ message, image, language }) {
  const formData = new FormData();
  formData.append('message', message.trim());
  formData.append('language', language);

  if (image?.uri) {
    formData.append('image', {
      uri: image.uri,
      name: 'chat-image.jpg',
      type: image.mimeType || 'image/jpeg',
    });
  }

  return formData;
}

// Start a brand-new AI chat.
export async function startAiChat({ token, message, image, language }) {
  return fetchJson(`${API_URL}/recipe/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: buildChatFormData({ message, image, language }),
  });
}

// Send a follow-up message to an existing chat.
export async function continueAiChat({ token, chatId, message, image, language }) {
  return fetchJson(`${API_URL}/recipe/chat/${chatId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: buildChatFormData({ message, image, language }),
  });
}
