const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { GoogleGenAI } = require('@google/genai');

const HISTORY_FILE = path.join(__dirname, '..', 'history.json');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

function normalizeLanguage(language) {
  const supported = ['en', 'he', 'es', 'fr', 'ar'];
  if (!language) return 'en';
  const short = String(language).toLowerCase().slice(0, 2);
  return supported.includes(short) ? short : 'en';
}

async function ensureHistoryFile() {
  try {
    await fs.promises.access(HISTORY_FILE, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(HISTORY_FILE, '[]', 'utf8');
  }
}

async function readHistory() {
  await ensureHistoryFile();
  const raw = await fs.promises.readFile(HISTORY_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeHistory(chats) {
  await fs.promises.writeFile(HISTORY_FILE, JSON.stringify(chats, null, 2), 'utf8');
}

function getRecipeNamesForContext(chat) {
  return (chat.entries || [])
    .map((entry) => entry.recipe?.recipeName)
    .filter(Boolean)
    .slice(-8)
    .join(', ');
}

function buildSystemPrompt({ language, historyNames }) {
  const requestedLanguage = String(language || 'en').toUpperCase();
  return `You are the "Broke Student Survival Chef", a smart AI culinary assistant designed to help college students make fast, ultra-cheap, and delicious meals using only the ingredients they have available in their fridge or pantry.

Your core task is to analyze the provided image of food ingredients, detect what items are present, and generate an appropriate recipe.

CRITICAL OUTPUT RULES:
1. Identify all visible ingredients accurately. Ignore any non-food items.
2. Formulate exactly ONE recipe that heavily utilizes the detected ingredients.
3. You may assume the user has basic kitchen staples: salt, pepper, cooking oil, and water. Do not assume they have expensive spices or specialized equipment.
4. Keep the recipe preparation time under 20 minutes and optimized for a low student budget.
5. You must return your response in a strict, clean JSON format so the mobile app can parse it directly. Do not include any markdown wrap like \`\`\`json or conversational text before/after the JSON block.

The JSON structure must be exactly as follows:
{
  "recipeName": "String",
  "prepTime": "String (e.g., 15 mins)",
  "estimatedCost": "String (e.g., Low / Under 15₪)",
  "detectedIngredients": ["Array of Strings"],
  "missingIngredients": ["Array of Strings of basic things they might need to add"],
  "instructions": ["Array of Strings for step-by-step guidance"]
}

User context:
- Requested Language: ${requestedLanguage}
- User's Cooking History: ${historyNames || 'None'}
`;
}

function extractJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  const jsonSlice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch {
    return null;
  }
}

function sanitizeRecipe(data) {
  const fallback = {
    recipeName: 'Quick Pantry Meal',
    prepTime: '15 mins',
    estimatedCost: 'Low',
    detectedIngredients: [],
    missingIngredients: [],
    instructions: ['Mix available ingredients and cook until ready.'],
  };

  if (!data || typeof data !== 'object') return fallback;

  return {
    recipeName: String(data.recipeName || fallback.recipeName),
    prepTime: String(data.prepTime || fallback.prepTime),
    estimatedCost: String(data.estimatedCost || fallback.estimatedCost),
    detectedIngredients: Array.isArray(data.detectedIngredients)
      ? data.detectedIngredients.map((x) => String(x))
      : fallback.detectedIngredients,
    missingIngredients: Array.isArray(data.missingIngredients)
      ? data.missingIngredients.map((x) => String(x))
      : fallback.missingIngredients,
    instructions: Array.isArray(data.instructions) && data.instructions.length > 0
      ? data.instructions.map((x) => String(x))
      : fallback.instructions,
  };
}

async function callGemini({ imageBase64, mimeType, language, historyNames, userMessage }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.HEMINI_API_KEY || process.env.JEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Add GEMINI_API_KEY to backend .env');
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildSystemPrompt({ language, historyNames });
  const question = userMessage
    ? `User follow-up: ${userMessage}`
    : 'Analyze this image and return one recipe.';

  const parts = [{ text: `${prompt}\n${question}` }];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts }],
    config: { temperature: 0.4 },
  });

  const text = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = extractJson(text);
  return sanitizeRecipe(parsed);
}

function toImageMeta(file) {
  if (!file) return null;
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

/**
 * GET /api/recipe
 */
const getAllRecipes = async (req, res, next) => {
  try {
    // TODO: fetch all recipes from DB (add pagination via req.query)

    res.status(200).json({ success: true, message: 'getAllRecipes – not yet implemented', data: [] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/recipe/:id
 */
const getRecipeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: fetch recipe by id from DB

    res.status(200).json({ success: true, message: 'getRecipeById – not yet implemented', id });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/recipe
 * Body: { title, ingredients, steps, ... }
 */
const createRecipe = async (req, res, next) => {
  try {
    // TODO: validate body and save new recipe to DB (req.user.id = owner)

    res.status(201).json({ success: true, message: 'createRecipe – not yet implemented' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/recipe/:id
 */
const updateRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: find recipe by id, verify ownership, update fields

    res.status(200).json({ success: true, message: 'updateRecipe – not yet implemented', id });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/recipe/:id
 */
const deleteRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: find recipe by id, verify ownership, delete

    res.status(200).json({ success: true, message: 'deleteRecipe – not yet implemented', id });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/recipe/chat
 * List all chats for authenticated user
 */
const getChats = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const history = await readHistory();
    const chats = history
      .filter((chat) => chat.userId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map((chat) => ({
        id: chat.id,
        title: chat.title,
        language: chat.language,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        entryCount: Array.isArray(chat.entries) ? chat.entries.length : 0,
      }));

    return res.status(200).json({ success: true, chats });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/recipe/chat/:chatId
 * Get full chat details
 */
const getChatById = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;

    const history = await readHistory();
    const chat = history.find((c) => c.id === chatId && c.userId === userId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    return res.status(200).json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/recipe/chat
 * Body (multipart): message + optional image + language
 */
const createChat = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const message = String(req.body?.message || '').trim();
    const language = normalizeLanguage(req.body?.language);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!message && (!req.file || !req.file.buffer)) {
      return res.status(400).json({ success: false, message: 'Message or image is required' });
    }

    const history = await readHistory();
    const userHistoryNames = history
      .filter((chat) => chat.userId === userId)
      .flatMap((chat) => getRecipeNamesForContext(chat).split(',').map((x) => x.trim()).filter(Boolean))
      .slice(-10)
      .join(', ');

    const imageBase64 = req.file?.buffer ? req.file.buffer.toString('base64') : null;
    const recipe = await callGemini({
      imageBase64,
      mimeType: req.file?.mimetype || 'image/jpeg',
      language,
      historyNames: userHistoryNames,
      userMessage: message,
    });

    const now = new Date().toISOString();
    const chatId = `chat_${randomUUID()}`;
    const entry = {
      id: `entry_${randomUUID()}`,
      type: 'message',
      createdAt: now,
      userMessage: message || 'Image prompt',
      recipe,
      image: toImageMeta(req.file),
    };

    const newChat = {
      id: chatId,
      userId,
      title: recipe.recipeName,
      language,
      createdAt: now,
      updatedAt: now,
      entries: [entry],
    };

    history.push(newChat);
    await writeHistory(history);

    return res.status(201).json({ success: true, chatId, recipe, chat: newChat });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/recipe/scan
 * Body (multipart): image + language
 */
const scanRecipe = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const language = normalizeLanguage(req.body?.language);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const history = await readHistory();
    const userHistoryNames = history
      .filter((chat) => chat.userId === userId)
      .flatMap((chat) => getRecipeNamesForContext(chat).split(',').map((x) => x.trim()).filter(Boolean))
      .slice(-10)
      .join(', ');

    const imageBase64 = req.file.buffer.toString('base64');
    const recipe = await callGemini({
      imageBase64,
      mimeType: req.file.mimetype || 'image/jpeg',
      language,
      historyNames: userHistoryNames,
      userMessage: '',
    });

    const now = new Date().toISOString();
    const chatId = `chat_${randomUUID()}`;
    const entry = {
      id: `entry_${randomUUID()}`,
      type: 'scan',
      createdAt: now,
      userMessage: 'Scan from camera',
      recipe,
      image: toImageMeta(req.file),
    };

    const newChat = {
      id: chatId,
      userId,
      title: recipe.recipeName,
      language,
      createdAt: now,
      updatedAt: now,
      entries: [entry],
    };

    history.push(newChat);
    await writeHistory(history);

    return res.status(201).json({ success: true, chatId, recipe, chat: newChat });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/recipe/chat/:chatId
 * Body (multipart): message + optional image + language
 */
const continueChat = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;
    const message = String(req.body?.message || '').trim();
    const language = normalizeLanguage(req.body?.language);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!message && (!req.file || !req.file.buffer)) {
      return res.status(400).json({ success: false, message: 'Message or image is required' });
    }

    const history = await readHistory();
    const chatIndex = history.findIndex((c) => c.id === chatId && c.userId === userId);
    if (chatIndex === -1) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const chat = history[chatIndex];
    const historyNames = getRecipeNamesForContext(chat);
    const imageBase64 = req.file?.buffer ? req.file.buffer.toString('base64') : null;

    const recipe = await callGemini({
      imageBase64,
      mimeType: req.file?.mimetype || 'image/jpeg',
      language,
      historyNames,
      userMessage: message,
    });

    const now = new Date().toISOString();
    const entry = {
      id: `entry_${randomUUID()}`,
      type: 'message',
      createdAt: now,
      userMessage: message || 'Image follow-up',
      recipe,
      image: toImageMeta(req.file),
    };

    const updatedChat = {
      ...chat,
      language,
      updatedAt: now,
      title: chat.title || recipe.recipeName,
      entries: [...(chat.entries || []), entry],
    };

    history[chatIndex] = updatedChat;
    await writeHistory(history);

    return res.status(200).json({ success: true, chat: updatedChat, entry, recipe });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getChats,
  getChatById,
  createChat,
  scanRecipe,
  continueChat,
};
