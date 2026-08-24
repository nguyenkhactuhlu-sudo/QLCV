// Authentication service with Supabase Auth support
import { APP_CONFIG } from "../utils/constants.js";
import { getSupabaseClient } from "../api/supabaseClient.js";

export class AuthService {
  constructor() {
    this._currentUser = null;
    this._listeners = [];
  }

  get currentUser() {
    return this._currentUser;
  }

  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  _notify() {
    this._listeners.forEach(fn => fn(this._currentUser));
  }

  async login(credentials) {
    if (APP_CONFIG.DEMO_MODE) {
      // Demo mode: use pre-defined users
      this._currentUser = credentials;
      this._notify();
      return this._currentUser;
    }

    // Production mode: use Supabase Auth
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase not configured");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    this._currentUser = {
      id: data.user.id,
      email: data.user.email,
      ...profile,
    };
    this._notify();
    return this._currentUser;
  }

  async loginWithMagicLink(email) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not configured");

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return { message: "Check your email for the magic link" };
  }

  async register(data) {
    if (APP_CONFIG.DEMO_MODE) {
      // Demo: just store in localStorage
      return { success: true, message: "Registration simulated" };
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not configured");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          unit_id: data.unitId,
          role: "staff",
        },
      },
    });

    if (authError) throw authError;

    // Add to pending accounts
    await supabase.from("pending_accounts").insert({
      email: data.email,
      full_name: data.fullName,
      unit_id: data.unitId,
      registration_code_id: data.registrationCodeId,
    });

    return { success: true, message: "Registration successful. Awaiting approval." };
  }

  async logout() {
    if (!APP_CONFIG.DEMO_MODE) {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    this._currentUser = null;
    this._notify();
  }

  async checkSession() {
    if (APP_CONFIG.DEMO_MODE) {
      return this._currentUser;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    this._currentUser = { id: session.user.id, ...profile };
    this._notify();
    return this._currentUser;
  }

  isAuthenticated() {
    return this._currentUser !== null;
  }

  hasRole(...roles) {
    if (!this._currentUser) return false;
    return roles.includes(this._currentUser.role);
  }
}

// Singleton instance
export const authService = new AuthService();
