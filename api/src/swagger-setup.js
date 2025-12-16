const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Schémas globaux pour la documentation
const components = {
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
        name: { type: "string", description: "Nom de l'utilisateur" },
        email: {
          type: "string",
          format: "email",
          description: "Email de l'utilisateur",
        },
        workouts_completed: {
          type: "integer",
          description: "Nombre de workouts complétés",
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
      required: ["name", "email", "password"],
      properties: {
        name: { type: "string", example: "John Doe" },
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
      },
    },
    UserUpdate: {
      type: "object",
      properties: {
        name: { type: "string", example: "John Doe Updated" },
        email: {
          type: "string",
          format: "email",
          example: "john.updated@example.com",
        },
        password: {
          type: "string",
          format: "password",
          minLength: 6,
          example: "newsecurepassword123",
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
