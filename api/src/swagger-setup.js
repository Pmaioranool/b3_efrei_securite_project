const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Schémas globaux pour la documentation
const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description:
        "Utiliser le header Authorization: Bearer <token> pour les routes protégées",
    },
  },
  schemas: {
    Exercise: {
      type: "object",
      properties: {
        _id: { type: "string", description: "ID unique de l'exercice" },
        Title: { type: "string", description: "Titre de l'exercice" },
        Desc: { type: "string", description: "Description de l'exercice" },
        Type: {
          type: "string",
          description: "Type d'exercice (Strength, Cardio, etc.)",
        },
        BodyPart: { type: "string", description: "Partie du corps ciblée" },
        Equipment: { type: "string", description: "Équipement nécessaire" },
        Level: {
          type: "string",
          enum: ["Beginner", "Intermediate", "Advanced"],
          description: "Niveau de difficulté",
        },
        Rating: {
          type: "number",
          minimum: 0,
          maximum: 5,
          description: "Note moyenne de l'exercice",
        },
        RatingDesc: { type: "string", description: "Description de la note" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
    ExerciseInput: {
      type: "object",
      required: ["Title", "Type", "BodyPart", "Equipment", "Level"],
      properties: {
        Title: { type: "string", example: "Push Up" },
        Desc: { type: "string", example: "Upper body exercise" },
        Type: { type: "string", example: "Strength" },
        BodyPart: { type: "string", example: "Chest" },
        Equipment: { type: "string", example: "Bodyweight" },
        Level: {
          type: "string",
          enum: ["Beginner", "Intermediate", "Advanced"],
          example: "Beginner",
        },
        Rating: { type: "number", example: 4.5 },
        RatingDesc: {
          type: "string",
          example: "Excellent for chest development",
        },
      },
    },
    Workout: {
      type: "object",
      properties: {
        _id: { type: "string", description: "ID unique du workout" },
        name: { type: "string", description: "Nom du workout" },
        exercises: {
          type: "array",
          items: { $ref: "#/components/schemas/Exercise" },
          description: "Liste des exercices du workout",
        },
        userId: {
          type: "array",
          items: { type: "number" },
          description: "IDs des utilisateurs associés",
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
    WorkoutInput: {
      type: "object",
      required: ["name", "duration"],
      properties: {
        name: { type: "string", example: "Full Body Workout" },
        duration: { type: "number", example: 60 },
        date: {
          type: "string",
          format: "date-time",
          example: "2023-12-01T10:00:00Z",
        },
        exercises: {
          type: "array",
          items: { type: "string" },
          description: "Liste des IDs d'exercices",
          example: ["64abc123def456789012345", "64abc123def456789012346"],
        },
      },
    },
    User: {
      type: "object",
      properties: {
        id: { type: "integer", description: "ID unique de l'utilisateur" },
        pseudonym: { type: "string", description: "Pseudonyme unique" },
        birthdate: {
          type: "string",
          format: "date",
          description: "Date de naissance",
        },
        email: {
          type: "string",
          format: "email",
          description: "Email de l'utilisateur",
        },
        role: {
          type: "string",
          enum: ["USER", "ADMIN", "COACH"],
          description: "Rôle de l'utilisateur",
        },
        last_login: {
          type: "string",
          format: "date-time",
          description: "Date de dernière connexion",
        },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    },
    UserInput: {
      type: "object",
      required: ["pseudonym", "birthdate", "email", "password"],
      properties: {
        pseudonym: { type: "string", example: "johndoe" },
        birthdate: { type: "string", format: "date", example: "1990-01-01" },
        email: {
          type: "string",
          format: "email",
          example: "john.doe@example.com",
        },
        password: {
          type: "string",
          format: "password",
          minLength: 6,
          example: "securepassword123",
        },
        role: {
          type: "string",
          enum: ["USER", "ADMIN", "COACH"],
          example: "USER",
          description: "Rôle (optionnel, par défaut USER)",
        },
      },
    },
    UserUpdate: {
      type: "object",
      properties: {
        pseudonym: { type: "string", example: "johndoe" },
        birthdate: { type: "string", format: "date", example: "1990-01-01" },
        email: {
          type: "string",
          format: "email",
          example: "john.updated@example.com",
        },
      },
    },
    Routine: {
      type: "object",
      properties: {
        _id: { type: "string", description: "ID unique de la routine" },
        userId: {
          type: "integer",
          description: "ID de l'utilisateur propriétaire de la routine",
        },
        workoutId: {
          type: "string",
          description: "ID du workout associé à la routine",
        },
        cron: {
          type: "string",
          description: "Expression CRON pour la planification de la routine",
          example: "0 8 * * 1,3,5",
        },
        timezone: {
          type: "string",
          description: "Timezone pour l'exécution de la routine",
          default: "Europe/Paris",
          example: "Europe/Paris",
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
    RoutineInput: {
      type: "object",
      required: ["userId", "workoutId", "cron"],
      properties: {
        userId: {
          type: "integer",
          description: "ID de l'utilisateur",
          example: 1,
        },
        workoutId: {
          type: "string",
          description: "ID du workout (MongoDB ObjectId)",
          example: "64abc123def456789012345",
        },
        cron: {
          type: "string",
          description:
            "Expression CRON (format: minute heure jour mois jour-semaine)",
          example: "0 8 * * 1,3,5",
        },
        timezone: {
          type: "string",
          description: "Timezone (optionnel, défaut: Europe/Paris)",
          example: "Europe/Paris",
        },
      },
    },
    RoutineUpdate: {
      type: "object",
      properties: {
        workoutId: {
          type: "string",
          description: "ID du workout (MongoDB ObjectId)",
          example: "64abc123def456789012345",
        },
        cron: {
          type: "string",
          description: "Expression CRON",
          example: "0 9 * * 2,4,6",
        },
        timezone: {
          type: "string",
          description: "Timezone",
          example: "America/New_York",
        },
      },
    },
  },
};

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fitness Workout Manager API",
      version: "1.0.0",
      description:
        "API complète pour la gestion d'exercices, workouts et utilisateurs",
      contact: {
        name: "Support API",
        email: "support@fitnessapp.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Serveur de développement",
      },
    ],
    components: components,
  },
  apis: ["./src/routes/*.js"], // Seulement les fichiers de routes maintenant
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Fitness API Documentation",
    })
  );
};
