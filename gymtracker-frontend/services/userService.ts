import apiService from "./apiService";

export interface User {
  id: string;
  pseudonym: string;
  email: string;
  role: string;
  avatar?: string;
  stats?: UserStats;
  goals?: UserGoals;
  created_at?: string;
  updated_at?: string;
}

export interface UserStats {
  age?: number;
  weight?: number;
  height?: number;
}

export interface UserGoals {
  weeklyWorkouts?: number;
  dailyCalories?: number;
  targetWeight?: number;
}

export interface UpdateUserData {
  pseudonym?: string;
  email?: string;
  password?: string;
  avatar?: string;
  stats?: UserStats;
  goals?: UserGoals;
}

class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await apiService.get<User>("/api/users/me");
    } catch (error: any) {
      // Si la route n'existe pas ou erreur, retourner les données du localStorage
      const userStr = localStorage.getItem("user");
      if (userStr) {
        return JSON.parse(userStr);
      }
      throw error;
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateUserData): Promise<User> {
    return apiService.put<User>("/api/users/me", data);
  }

  /**
   * Update user stats (age, weight, height)
   */
  async updateStats(stats: UserStats): Promise<User> {
    try {
      return await apiService.put<User>("/api/users/me/stats", stats);
    } catch (error: any) {
      // Si la route n'existe pas, sauvegarder localement
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.stats = { ...user.stats, ...stats };
        localStorage.setItem("user", JSON.stringify(user));
        return user;
      }
      throw error;
    }
  }

  /**
   * Update user goals
   */
  async updateGoals(goals: UserGoals): Promise<User> {
    return apiService.put<User>("/api/users/me/goals", goals);
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    return apiService.put<void>("/api/users/me/password", {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Delete current user account
   */
  async deleteAccount(): Promise<void> {
    return apiService.delete<void>("/api/users/me");
  }
}

export default UserService.getInstance();
