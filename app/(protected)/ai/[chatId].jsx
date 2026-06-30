import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  continueAiChat,
  loadChat,
  loadChats,
  pickCameraImage,
  pickGalleryImage,
  requireAuthToken,
} from './ai-utils';

export default function AiChatDetailScreen() {
  const { chatId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState('');
  const [pickedImage, setPickedImage] = useState(null);
  const [error, setError] = useState('');

  // Load the chat list for the top row.
  async function loadChatList(token) {
    const { response, data } = await loadChats(token);

    if (response.ok) {
      setChats(data.chats || []);
    }
  }

  // Load the selected chat from the server.
  async function loadSelectedChat() {
    setLoading(true);
    setError('');

    const token = await requireAuthToken(router);
    if (!token) return;

    try {
      const { response, data } = await loadChat(token, chatId);

      if (!response.ok) {
        setError(data?.message || 'Failed to load chat');
        return;
      }

      setChat(data.chat);
      await loadChatList(token);
    } catch {
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  }

  // Reload when the route changes.
  useEffect(() => {
    if (!chatId) return;

    async function loadInitialChat() {
      setLoading(true);
      setError('');

      const token = await requireAuthToken(router);
      if (!token) return;

      try {
        const { response, data } = await loadChat(token, chatId);

        if (!response.ok) {
          setError(data?.message || 'Failed to load chat');
          return;
        }

        setChat(data.chat);
        await loadChatList(token);
      } catch {
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    }

    loadInitialChat();
  }, [chatId]);

  // Pick an image from camera or gallery.
  async function chooseImage(picker) {
    const image = await picker();
    if (image) {
      setPickedImage(image);
    }
  }

  // Send a follow-up message to the AI.
  async function sendFollowUp() {
    if (!message.trim() && !pickedImage?.uri) {
      Alert.alert('Missing input', 'Add a message or image to continue the chat.');
      return;
    }

    setSending(true);
    const token = await requireAuthToken(router);
    if (!token) {
      setSending(false);
      return;
    }

    try {
      const { response, data } = await continueAiChat({
        token,
        chatId,
        message,
        image: pickedImage,
        language: chat?.language || 'en',
      });

      if (!response.ok) {
        Alert.alert('AI Error', data?.message || 'Could not continue chat');
        return;
      }

      setChat(data.chat);
      setMessage('');
      setPickedImage(null);
      await loadChatList(token);
    } catch {
      Alert.alert('AI Error', 'Could not continue chat');
    } finally {
      setSending(false);
    }
  }

  // Loading state.
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#E8750A" />
      </SafeAreaView>
    );
  }

  // Error state.
  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadSelectedChat}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Show the newest recipe from the chat.
  const latestRecipe = chat?.entries?.[chat.entries.length - 1]?.recipe;

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Header */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Text style={styles.navText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.topTitle} numberOfLines={1}>
          {chat?.title || 'AI Chat'}
        </Text>

        <TouchableOpacity onPress={loadSelectedChat} style={styles.navBtn}>
          <Text style={styles.navText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Chat history chips */}
      <View style={styles.chatListWrap}>
        <FlatList
          horizontal
          data={chats}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chatChip, item.id === chatId && styles.chatChipActive]}
              onPress={() => router.replace(`/(protected)/ai/${item.id}`)}
            >
              <Text style={[styles.chatChipText, item.id === chatId && styles.chatChipTextActive]} numberOfLines={1}>
                {item.title || 'Chat'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Main content */}
      <ScrollView contentContainerStyle={styles.body}>
        {!latestRecipe ? (
          <Text style={styles.empty}>No recipe generated yet.</Text>
        ) : (
          <>
            <Text style={styles.recipeName}>{latestRecipe.recipeName}</Text>

            {/* Recipe info */}
            <View style={styles.metaRow}>
              <Text style={styles.metaItem}>⏱ {latestRecipe.prepTime}</Text>
              <Text style={styles.metaItem}>💸 {latestRecipe.estimatedCost}</Text>
            </View>

            {/* Detected ingredients */}
            <Text style={styles.sectionTitle}>Detected Ingredients</Text>
            {(latestRecipe.detectedIngredients || []).map((item, index) => (
              <Text key={`det-${index}`} style={styles.listItem}>• {item}</Text>
            ))}

            {/* Missing ingredients */}
            <Text style={styles.sectionTitle}>Missing Ingredients</Text>
            {(latestRecipe.missingIngredients || []).length === 0 ? (
              <Text style={styles.listItem}>• None</Text>
            ) : (
              (latestRecipe.missingIngredients || []).map((item, index) => (
                <Text key={`miss-${index}`} style={styles.listItem}>• {item}</Text>
              ))
            )}

            {/* Step-by-step instructions */}
            <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
            {(latestRecipe.instructions || []).map((step, index) => (
              <View key={`step-${index}`} style={styles.stepRow}>
                <View style={styles.stepNumWrap}>
                  <Text style={styles.stepNum}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Composer */}
      <View style={styles.composer}>
        {pickedImage?.uri && (
          <View style={styles.previewWrap}>
            <Image source={{ uri: pickedImage.uri }} style={styles.preview} />
            <TouchableOpacity style={styles.removePreview} onPress={() => setPickedImage(null)}>
              <Text style={styles.removePreviewText}>X</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Ask the AI for next cooking step..."
          style={styles.input}
          multiline
        />

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => chooseImage(pickCameraImage)}>
            <Text style={styles.secondaryBtnText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => chooseImage(pickGalleryImage)}>
            <Text style={styles.secondaryBtnText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, sending && { opacity: 0.7 }]}
            onPress={sendFollowUp}
            disabled={sending}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>Send</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Screen background.
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },

  // Centered loading or error state.
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#E8750A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Top bar.
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e8ef',
    backgroundColor: '#fff',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
    color: '#111827',
  },
  navBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  navText: {
    color: '#374151',
    fontWeight: '600',
  },

  // Horizontal chat list.
  chatListWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#eceef3',
    backgroundColor: '#fff',
  },
  chatList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  chatChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 180,
  },
  chatChipActive: {
    backgroundColor: '#E8750A',
  },
  chatChipText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  chatChipTextActive: {
    color: '#fff',
  },

  // Scrollable recipe content.
  body: {
    padding: 16,
    paddingBottom: 220,
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 30,
  },
  recipeName: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metaItem: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: '#374151',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 14,
    marginBottom: 8,
  },
  listItem: {
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8750A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  stepNum: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    color: '#1f2937',
    lineHeight: 21,
  },

  // Bottom composer.
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
  },
  previewWrap: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  removePreview: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePreviewText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    minHeight: 58,
    maxHeight: 120,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  secondaryBtn: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  primaryBtn: {
    marginLeft: 'auto',
    backgroundColor: '#E8750A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 74,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});
