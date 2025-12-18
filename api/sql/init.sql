-- Init script for PostgreSQL users table and mock data
-- Schema aligns with existing constraints in this SQL file
CREATE TABLE
    IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        pseudonym VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        password_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        refresh_token_version INTEGER NOT NULL DEFAULT 0,
        last_login TIMESTAMP NULL
    );

-- -- Seed users. Use ON CONFLICT to keep script idempotent.
INSERT INTO
    users (pseudonym, email, password, role)
VALUES
    (
        'admin',
        'admin@admin.com',
        '$2b$10$BiF7U5pz3yvYDiaPYhmo7exq4xwpIphtA.HvATVBbx2AnhbJHFjuK',
        'ADMIN'
    ) ON CONFLICT (email) DO NOTHING;