const User = require("../models/User.model");

exports.getUser = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pagesize = parseInt(req.query.pagesize) || 10;
  try {
    const users = await User.getAll(page, pagesize);
    return res.status(200).json(users);
  } catch (e) {
    next(e);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    // req.user est déjà défini par le middleware authenticateToken
    const user = await User.getById(req.user.userId);
    return res.status(200).json(user);
  } catch (e) {
    next(e);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.getById(req.params.id);
    return res.status(200).json(user);
  } catch (e) {
    next(e);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { pseudonym, email } = req.body;
    const updatedUser = await User.update(req.params.id, {
      pseudonym,
      email,
    });
    return res.status(200).json(updatedUser);
  } catch (e) {
    next(e);
  }
};

exports.updateUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const updatedUser = await User.updatePassword(req.params.id, password);
    return res.status(200).json(updatedUser);
  } catch (e) {
    next(e);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Vérifier l'ancien mot de passe
    const user = await User.getById(userId);
    const bcrypt = require("bcrypt");
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isValidPassword) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }

    // Mettre à jour le mot de passe
    const updatedUser = await User.updatePassword(userId, newPassword);
    return res
      .status(200)
      .json({ message: "Mot de passe modifié avec succès" });
  } catch (e) {
    next(e);
  }
};

exports.updateUserLastLogin = async (req, res, next) => {
  try {
    const { last_login } = req.body;
    const updatedUser = await User.updateLastLogin(req.params.id, last_login);
    return res.status(200).json(updatedUser);
  } catch (e) {
    next(e);
  }
};

exports.incrementUserWorkoutsCompleted = async (req, res, next) => {
  try {
    const { workoutId } = req.body;
    const updatedUser = await User.incrementWorkoutsCompleted(
      req.params.id,
      workoutId
    );
    return res.status(200).json(updatedUser);
  } catch (e) {
    next(e);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.delete(req.params.id);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (e) {
    next(e);
  }
};
