const { pool } = require("../config/db.postgres");
const Workout = require("./Workout.model");
const JWTService = require("../utils/jwt");

class User {
  static async getAll(page = 1, pagesize = 10) {
    const res = await pool.query(
      "SELECT id, pseudonym, email, role, last_login, created_at, updated_at FROM users ORDER BY id"
    );
    console.log(page, pagesize);
    const start = (page - 1) * pagesize;
    const end = start + pagesize;
    const result = res.rows.slice(start, end);
    return result;
  }

  static async getById(id) {
    const res = await pool.query(
      "SELECT id, pseudonym, email, role, last_login, created_at, updated_at FROM users WHERE id = $1",
      [id]
    );
    return res.rows[0] || null;
  }

  static async getAuthState(id) {
    const res = await pool.query(
      "SELECT id, email, role, pseudonym, refresh_token_version, password_updated_at FROM users WHERE id = $1",
      [id]
    );
    return res.rows[0] || null;
  }

  static async getByEmail(email) {
    const res = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return res.rows[0] || null;
  }

  static async getByPseudonym(pseudonym) {
    const res = await pool.query("SELECT * FROM users WHERE pseudonym = $1", [
      pseudonym,
    ]);
    return res.rows[0] || null;
  }

  // Création : le mot de passe en clair est immédiatement haché via JWTService
  // (bcrypt + pepper optionnel) avant insertion en base.
  static async create({ pseudonym, email, password, role = "user" }) {
    const hashedPassword = await JWTService.hashPassword(password);
    const res = await pool.query(
      "INSERT INTO users (pseudonym, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, pseudonym, email, role, last_login, created_at, updated_at, password_updated_at, refresh_token_version",
      [pseudonym, email, hashedPassword, role]
    );
    return res.rows[0];
  }

  static async update(id, { pseudonym, email }) {
    const res = await pool.query(
      "UPDATE users SET pseudonym = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, pseudonym, email, role, last_login, created_at, updated_at",
      [pseudonym, email, id]
    );
    return res.rows[0] || null;
  }

  // Mise à jour : on ré-hache toujours le mot de passe fourni avec la
  // configuration actuelle (permet d'élever le niveau de sécurité au fil du temps).
  static async updatePassword(id, password) {
    const hashedPassword = await JWTService.hashPassword(password);
    const res = await pool.query(
      "UPDATE users SET password = $1, password_updated_at = CURRENT_TIMESTAMP, refresh_token_version = refresh_token_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, pseudonym, email, role, last_login, created_at, updated_at, password_updated_at, refresh_token_version",
      [hashedPassword, id]
    );
    return res.rows[0] || null;
  }

  static async updateLastLogin(id, lastLogin) {
    const res = await pool.query(
      "UPDATE users SET last_login = $1 WHERE id = $2 RETURNING id, pseudonym, email, role, last_login, created_at, updated_at, password_updated_at, refresh_token_version",
      [lastLogin, id]
    );
    return res.rows[0] || null;
  }

  static async bumpRefreshTokenVersion(id) {
    const res = await pool.query(
      "UPDATE users SET refresh_token_version = refresh_token_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, role, pseudonym, refresh_token_version, password_updated_at, last_login, created_at, updated_at",
      [id]
    );
    return res.rows[0] || null;
  }

  static async delete(id) {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return { deleted: true };
  }
}

module.exports = User;
