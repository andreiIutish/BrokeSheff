import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Spoonacular endpoint to get full recipe details by ID
const SPOONACULAR_BASE = 'https://api.spoonacular.com/recipes';

export default function RecipeDetailScreen() {

  const { t } = useTranslation();

  // Only the recipe ID comes from the URL now — language is global via i18n
  const { id } = useLocalSearchParams();

  const [recipe, setRecipe]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');


  // --- Fetch full recipe details when the screen loads ---
  useEffect(() => {
    async function fetchRecipeDetail() {
      try {
        const apiKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
        const url = `${SPOONACULAR_BASE}/${id}/information?apiKey=${apiKey}&includeNutrition=false`;

        const response = await fetch(url);
        const data     = await response.json();

        if (!response.ok) {
          setError('Could not load recipe details.');
          return;
        }

        setRecipe(data);

      } catch (err) {
        setError('Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    }

    fetchRecipeDetail();
  }, [id]);


  // --- Loading state ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E8750A" />
      </View>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('detailError')}</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackText}>{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get step-by-step instructions from Spoonacular's analyzed format
  const steps = recipe.analyzedInstructions?.[0]?.steps || [];


  // --- Full detail UI ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── Hero image + back button ──────────────────────────── */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Floating back button on top of the image */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>

          {/* ── Title ────────────────────────────────────────────── */}
          <Text style={styles.title}>{recipe.title}</Text>

          {/* ── Meta row: time + servings + tags ─────────────────── */}
          <View style={styles.metaRow}>

            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#E8750A" />
              <Text style={styles.metaText}>{recipe.readyInMinutes} {t('minutes')}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="#E8750A" />
              <Text style={styles.metaText}>{recipe.servings} {t('servings')}</Text>
            </View>

            {recipe.cheap && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>💰 {t('tagCheap')}</Text>
              </View>
            )}

            {recipe.veryHealthy && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>✅ {t('tagHealthy')}</Text>
              </View>
            )}

            {recipe.vegetarian && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>🌿 {t('tagVegetarian')}</Text>
              </View>
            )}

          </View>

          {/* ── Ingredients ──────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>{t('ingredients')}</Text>

          {recipe.extendedIngredients?.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={styles.bullet} />
              <Text style={styles.ingredientText}>{ingredient.original}</Text>
            </View>
          ))}

          {/* ── Instructions ─────────────────────────────────────── */}
          {steps.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('instructions')}</Text>

              {steps.map((step) => (
                <View key={step.number} style={styles.stepRow}>

                  {/* Step number circle */}
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNumber}>{step.number}</Text>
                  </View>

                  {/* Step text */}
                  <Text style={styles.stepText}>{step.step}</Text>

                </View>
              ))}
            </>
          )}

          {/* Show a message if Spoonacular didn't return structured instructions */}
          {steps.length === 0 && (
            <Text style={styles.noInstructions}>
              {t('noSteps')}
            </Text>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 16,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  goBackBtn: {
    backgroundColor: '#E8750A',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  goBackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Image + back button
  imageContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 260,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 8,
  },

  // ── Body
  body: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },

  // ── Meta row
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  tag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    color: '#E8750A',
    fontWeight: '600',
  },

  // ── Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
  },

  // ── Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E8750A',
    marginTop: 6,
    flexShrink: 0,
  },
  ingredientText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },

  // ── Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8750A',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  noInstructions: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },

});
