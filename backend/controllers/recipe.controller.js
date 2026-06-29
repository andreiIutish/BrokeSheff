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

module.exports = { getAllRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe };
