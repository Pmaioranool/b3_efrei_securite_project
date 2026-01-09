import apiService from "./apiService";
import userService from "./userService";

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  exercises?: RoutineExercise[];
  created_at?: string;
  updated_at?: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  name: string;
  muscle_group?: string;
  sets: number;
  reps: number;
  weight?: number;
  rest_seconds?: number;
  order_index?: number;
}

export interface CreateRoutineData {
  workoutId: string; // MongoDB workout ObjectId
  cron: string; // standard 5-field cron expression
  timezone?: string;
}

class RoutineService {
  private static instance: RoutineService;

  private constructor() {}

  public static getInstance(): RoutineService {
    if (!RoutineService.instance) {
      RoutineService.instance = new RoutineService();
    }
    return RoutineService.instance;
  }

  /**
   * Get all routines for a specific user
   */
  async getRoutinesByUserId(userId: string): Promise<Routine[]> {
    return apiService.get<Routine[]>(`/api/routines/user/${userId}`);
  }

  /**
   * Get all routines for current user (helper)
   */
  async getMyRoutines(): Promise<Routine[]> {
    const me = await userService.getCurrentUser();
    const uid = me.id;
    return this.getRoutinesByUserId(uid);
  }

  /**
   * Get routine by ID
   */
  async getRoutineById(id: string): Promise<Routine> {
    return apiService.get<Routine>(`/api/routines/${id}`);
  }

  /**
   * Create a new routine
   */
  async createRoutine(data: CreateRoutineData): Promise<Routine> {
    return apiService.post<Routine>("/api/routines", data);
  }

  /**
   * Update a routine
   */
  async updateRoutine(
    id: string,
    data: Partial<CreateRoutineData>
  ): Promise<Routine> {
    return apiService.put<Routine>(`/api/routines/${id}`, data);
  }

  /**
   * Delete a routine
   */
  async deleteRoutine(id: string): Promise<void> {
    return apiService.delete<void>(`/api/routines/${id}`);
  }
}

export default RoutineService.getInstance();
