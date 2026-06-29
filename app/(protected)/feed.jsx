import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';


// ─── Supported languages ─────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

// ─── Spoonacular API URL builder ─────────────────────────────────────────────
// Builds the full URL with the right params depending on the active filter.

const SPOONACULAR_BASE = 'https://api.spoonacular.com/recipes/complexSearch';

function buildUrl(activeFilter) {
  const apiKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;

  // Base: 10 recipes, full info included, sorted cheapest first
  let url = `${SPOONACULAR_BASE}?apiKey=${apiKey}&number=10&addRecipeInformation=true&sort=price`;

  if (activeFilter === 'fast') {
    // Only recipes that are ready in under 15 minutes
    url += '&maxReadyTime=15';
  } else if (activeFilter === 'protein') {
    // Only recipes with at least 30g of protein
    url += '&minProtein=30&addRecipeNutrition=true';
  }
  // 'cheap' uses the default sort=price — nothing extra needed

  return url;
}


// ─── Recipe Card component ───────────────────────────────────────────────────
// Defined outside the main component so it doesn't get recreated on each render.

function RecipeCard({ recipe, isDark }) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
      onPress={() => router.push(`/(protected)/recipe/${recipe.id}`)}
      activeOpacity={0.85}
    >

      {/* Recipe image */}
      <Image
        source={{ uri: recipe.image }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      {/* Title and time */}
      <View style={styles.cardBody}>
        <Text
          style={[styles.cardTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>
        <Text style={styles.cardMeta}>
          ⏱  {recipe.readyInMinutes} {t('minutes')}
        </Text>
      </View>

    </TouchableOpacity>
  );
}


// ─── Main Feed Screen ────────────────────────────────────────────────────────

export default function FeedScreen() {

  const { t, i18n } = useTranslation();

  // Dark / light mode
  const [isDark, setIsDark] = useState(false);

  // Which filter chip is active ('cheap', 'fast', 'protein', or null = none)
  const [activeFilter, setActiveFilter] = useState(null);

  // Recipe list data
  const [recipes, setRecipes] = useState([]);

  // True on first load
  const [loading, setLoading] = useState(true);

  // True when the user is pull-to-refreshing
  const [refreshing, setRefreshing] = useState(false);

  // Any error message to show
  const [error, setError] = useState('');


  // --- Fetch recipes from Spoonacular ---
  async function fetchRecipes(isRefreshing = false) {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const url = buildUrl(activeFilter);
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setError(t('feedError'));
        return;
      }

      // Spoonacular wraps results in data.results
      setRecipes(data.results || []);

    } catch (err) {
      setError(t('feedError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Re-fetch whenever the active filter changes
  useEffect(() => {
    fetchRecipes();
  }, [activeFilter]);


  // --- Toggle a filter chip ---
  // Pressing the same chip twice turns it off
  function handleFilterPress(filter) {
    setActiveFilter(activeFilter === filter ? null : filter);
  }

  // --- Logout ---
  async function handleLogout() {
    await SecureStore.deleteItemAsync('token');
    router.replace('/login');
  }

  // --- Language picker (5 options) ---
  function handleLanguagePress() {
    const buttons = LANGUAGES.map((item) => ({
      text: item.label,
      onPress: () => i18n.changeLanguage(item.code),
    }));

    Alert.alert(t('selectLanguage'), '', [
      ...buttons,
      { text: 'Cancel', style: 'cancel' },
    ]);
  }


  // Colors that flip based on dark/light mode
  const bgColor     = isDark ? '#1a1a1a' : '#f2f2f2';
  const textColor   = isDark ? '#fff'    : '#1a1a1a';
  const headerBg    = isDark ? '#2a2a2a' : '#fff';

  // The three filter chips
  const chips = [
    { key: 'cheap',   label: t('cheap') },
    { key: 'fast',    label: t('fast') },
    { key: 'protein', label: t('protein') },
  ];


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: headerBg }]}>

        <Text style={[styles.greeting, { color: textColor }]}>
          {t('welcome')}
        </Text>

        <View style={styles.headerButtons}>

          {/* Dark / Light toggle */}
          <TouchableOpacity onPress={() => setIsDark(!isDark)} style={styles.iconButton}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={textColor} />
          </TouchableOpacity>

          {/* Language picker button */}
          <TouchableOpacity
            style={styles.langButton}
            onPress={handleLanguagePress}
          >
            <Ionicons name="language-outline" size={14} color="#fff" style={{ marginRight: 3 }} />
            <Text style={styles.langText}>{i18n.language.toUpperCase().slice(0, 2)}</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={22} color={textColor} />
          </TouchableOpacity>

        </View>
      </View>


      {/* ── Filter Chips ────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: headerBg }]}
        contentContainerStyle={styles.filterBarContent}
      >
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={[
              styles.chip,
              activeFilter === chip.key ? styles.chipActive : styles.chipInactive,
            ]}
            onPress={() => handleFilterPress(chip.key)}
          >
            <Text style={[
              styles.chipText,
              activeFilter === chip.key ? styles.chipTextActive : { color: textColor },
            ]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>


      {/* ── Feed ────────────────────────────────────────────────────────── */}
      {loading ? (
        // First load spinner
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E8750A" />
          <Text style={[styles.infoText, { color: textColor }]}>{t('loading')}</Text>
        </View>

      ) : error ? (
        // Error message
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>

      ) : (
        // Recipe list
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <RecipeCard recipe={item} isDark={isDark} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRecipes(true)}
              tintColor="#E8750A"
              colors={['#E8750A']}
            />
          }
          ListEmptyComponent={
            <Text style={[styles.infoText, { color: textColor, textAlign: 'center', marginTop: 40 }]}>
              {t('empty')}
            </Text>
          }
        />
      )}


      {/* ── AI Camera FAB ────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('AI Scanner', 'Opening camera...')}
      >
        <Ionicons name="sparkles" size={28} color="#fff" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}


// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  langButton: {
    backgroundColor: '#E8750A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  langText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Filter bar
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexShrink: 0,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#E8750A',
    borderColor: '#E8750A',
  },
  chipInactive: {
    borderColor: '#ddd',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },

  // ── Feed list
  listContent: {
    padding: 16,
    paddingBottom: 100, // space so the FAB doesn't cover the last card
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // ── Recipe card
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLight: {
    backgroundColor: '#fff',
  },
  cardDark: {
    backgroundColor: '#2a2a2a',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 13,
    color: '#888',
  },

  // ── FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E8750A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E8750A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

});

