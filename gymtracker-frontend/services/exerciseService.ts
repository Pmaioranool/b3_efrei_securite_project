import apiService from "./apiService";

export interface ExerciseDefinition {
  id: string;
  name: string;
  description?: string;
  muscle_group?: string;
  equipment?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  instructions?: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExerciseData {
  name: string;
  description?: string;
  muscle_group?: string;
  equipment?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  instructions?: string[];
  image_url?: string;
}

class ExerciseService {
  private static instance: ExerciseService;

  private constructor() {}

  public static getInstance(): ExerciseService {
    if (!ExerciseService.instance) {
      ExerciseService.instance = new ExerciseService();
    }
    return ExerciseService.instance;
  }

  /**
   * Get all exercises
   */
  async getExercises(): Promise<ExerciseDefinition[]> {
    return apiService.get<ExerciseDefinition[]>("/api/exercises");
  }

  /**
   * Get exercises aggregated by BodyPart, fetching up to `limitPer` per body part
   */
  async getExercisesByBodyParts(
    bodyParts: string[],
    limitPer: number = 20
  ): Promise<any[]> {
    const requests = bodyParts.map((bp) =>
      apiService.get<any[]>(
        `/api/exercises?BodyPart=${encodeURIComponent(bp)}&all=true`
      )
    );
    const results = await Promise.all(requests);
    const merged = results.flat();
    // Deduplicate by _id or id
    const map = new Map<string, any>();
    for (const ex of merged) {
      const key =
        (ex as any)._id || (ex as any).id || `${ex.Title}-${ex.BodyPart}`;
      if (!map.has(key)) map.set(key, ex);
    }
    return Array.from(map.values());
  }

  /**
   * Get exercises with server-side filtering and pagination
   */
  async getExercisesFiltered(params: {
    BodyPart?: string;
    Equipment?: string;
    title?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any[]> {
    const { BodyPart, Equipment, title, page = 0, pageSize = 20 } = params;
    const query = new URLSearchParams();
    if (BodyPart && BodyPart !== "Tous") query.set("BodyPart", BodyPart);
    if (Equipment && Equipment !== "Tous") query.set("Equipment", Equipment);
    if (title && title.trim().length > 0) query.set("title", title.trim());
    query.set("limit", String(pageSize));
    query.set("skip", String(page * pageSize));
    return apiService.get<any[]>(`/api/exercises?${query.toString()}`);
  }

  /**
   * Get exercise by ID
   */
  async getExerciseById(id: string): Promise<ExerciseDefinition> {
    return apiService.get<ExerciseDefinition>(`/api/exercises/${id}`);
  }

  /**
   * Create a new exercise (admin only)
   */
  async createExercise(data: CreateExerciseData): Promise<ExerciseDefinition> {
    return apiService.post<ExerciseDefinition>("/api/exercises", data);
  }

  /**
   * Update an exercise (admin only)
   */
  async updateExercise(
    id: string,
    data: Partial<CreateExerciseData>
  ): Promise<ExerciseDefinition> {
    return apiService.put<ExerciseDefinition>(`/api/exercises/${id}`, data);
  }

  /**
   * Delete an exercise (admin only)
   */
  async deleteExercise(id: string): Promise<void> {
    return apiService.delete<void>(`/api/exercises/${id}`);
  }

  /**
   * Search exercises by muscle group
   */
  async searchByMuscleGroup(
    muscleGroup: string
  ): Promise<ExerciseDefinition[]> {
    const exercises = await this.getExercises();
    return exercises.filter((ex) =>
      ex.muscle_group?.toLowerCase().includes(muscleGroup.toLowerCase())
    );
  }

  /**
   * Search exercises by name
   */
  async searchByName(name: string): Promise<ExerciseDefinition[]> {
    const exercises = await this.getExercises();
    return exercises.filter((ex) =>
      ex.name.toLowerCase().includes(name.toLowerCase())
    );
  }
}

export default ExerciseService.getInstance();
