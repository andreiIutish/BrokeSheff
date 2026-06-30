const express = require('express');
const router = express.Router();
const multer = require('multer');

const recipeController = require('../controllers/recipe.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/recipe          – list all recipes (public)
router.get('/', recipeController.getAllRecipes);

// GET /api/recipe/chat           – list user's AI chats (protected)
router.get('/chat', verifyToken, recipeController.getChats);

// POST /api/recipe/chat          – create new AI chat (protected)
router.post('/chat', verifyToken, upload.single('image'), recipeController.createChat);

// GET /api/recipe/chat/:chatId   – get one AI chat (protected)
router.get('/chat/:chatId', verifyToken, recipeController.getChatById);

// POST /api/recipe/scan          – image scan + first AI recipe (protected)
router.post('/scan', verifyToken, upload.single('image'), recipeController.scanRecipe);

// POST /api/recipe/chat/:chatId  – continue AI chat with text/optional image (protected)
router.post('/chat/:chatId', verifyToken, upload.single('image'), recipeController.continueChat);

// GET /api/recipe/:id      – get single recipe (public)
router.get('/:id', recipeController.getRecipeById);

// POST /api/recipe         – create a recipe (protected)
router.post('/', verifyToken, recipeController.createRecipe);

// PUT /api/recipe/:id      – update a recipe (protected)
router.put('/:id', verifyToken, recipeController.updateRecipe);

// DELETE /api/recipe/:id   – delete a recipe (protected)
router.delete('/:id', verifyToken, recipeController.deleteRecipe);

module.exports = router;
