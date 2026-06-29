const express = require('express');
const router = express.Router();

const recipeController = require('../controllers/recipe.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// GET /api/recipe          – list all recipes (public)
router.get('/', recipeController.getAllRecipes);

// GET /api/recipe/:id      – get single recipe (public)
router.get('/:id', recipeController.getRecipeById);

// POST /api/recipe         – create a recipe (protected)
router.post('/', verifyToken, recipeController.createRecipe);

// PUT /api/recipe/:id      – update a recipe (protected)
router.put('/:id', verifyToken, recipeController.updateRecipe);

// DELETE /api/recipe/:id   – delete a recipe (protected)
router.delete('/:id', verifyToken, recipeController.deleteRecipe);

module.exports = router;
