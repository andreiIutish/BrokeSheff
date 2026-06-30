import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  loadChats as fetchChatList,
  pickCameraImage,
  pickGalleryImage,
  requireAuthToken,
  startAiChat,
} from './ai-utils';

export default function AiChatsScreen() {
  const { i18n } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pickedImage, setPickedImage] = useState(null);

  async function loadChats() {
    setLoading(true);
    setError('');

    const token = await requireAuthToken(router);
    if (!token) return;

    try {
      const { response, data } = await fetchChatList(token);
      if (!response.ok) {
        setError(data?.message || 'Could not load chats');
        return;
      }

      setChats(data.chats || []);
    } catch {
      setError('Could not load chats');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChats();
  }, []);

  async function chooseImage(picker) {
    const image = await picker();
    if (image) setPickedImage(image);
  }

  async function startChat() {
    if (!message.trim() && !pickedImage?.uri) {
      Alert.alert('Missing input', 'Write a message or add an image to start a chat.');
      return;
    }

    setStarting(true);
    const token = await requireAuthToken(router);
    if (!token) {
      setStarting(false);
      return;
    }

    try {
      const { response, data } = await startAiChat({
        token,
        message,
        image: pickedImage,
        language: i18n.language,
      });

      if (!response.ok || !data?.chatId) {
        Alert.alert('AI Error', data?.message || 'Could not start AI chat');
        return;
      }

      setMessage('');
      setPickedImage(null);
      router.push(`/(protected)/ai/${data.chatId}`);
    } catch {
      Alert.alert('AI Error', 'Could not start AI chat');
    } finally {
      setStarting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Chef Chat</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadChats}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.composer}>
        <Text style={styles.composerTitle}>Start New Chat</Text>

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
          placeholder="What do you want to cook today?"
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
            style={[styles.primaryBtn, starting && { opacity: 0.7 }]}
            onPress={startChat}
            disabled={starting}
          >
            {starting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>Start</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Chat History</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E8750A" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No chats yet. Start one above.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/(protected)/ai/${item.id}`)}>
              <Text style={styles.cardTitle}>{item.title || 'Untitled Chat'}</Text>
              <Text style={styles.cardMeta}>{item.language?.toUpperCase()} • {item.entryCount || 0} entries</Text>
              <Text style={styles.cardMeta}>Updated: {new Date(item.updatedAt).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f7fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eceef3',
    backgroundColor: '#fff',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  backBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  backText: { color: '#374151', fontWeight: '600' },
  refreshBtn: { backgroundColor: '#E8750A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  refreshText: { color: '#fff', fontWeight: '700' },
  composer: {
    backgroundColor: '#fff',
    margin: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eceef3',
  },
  composerTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 8 },
  previewWrap: { alignSelf: 'flex-start', marginBottom: 8 },
  preview: { width: 72, height: 72, borderRadius: 8 },
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
  removePreviewText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  input: {
    minHeight: 56,
    maxHeight: 110,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  secondaryBtn: { backgroundColor: '#111827', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  secondaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  primaryBtn: {
    marginLeft: 'auto',
    backgroundColor: '#E8750A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 74,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  historyHeader: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
  historyTitle: { fontSize: 15, fontWeight: '800', color: '#374151' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#dc2626' },
  list: { padding: 14, paddingTop: 8 },
  empty: { textAlign: 'center', marginTop: 30, color: '#6b7280' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 },
  cardMeta: { fontSize: 13, color: '#6b7280' },
});
