// Unified data adapter - works with Demo (localStorage) or Supabase
import { APP_CONFIG, STORAGE_KEYS } from "../utils/constants.js";
import { getSupabaseClient } from "./supabaseClient.js";
import { authService } from "../auth/authService.js";

let currentAdapter = null;

// ============================================
// DEMO ADAPTER (localStorage)
// ============================================
const demoAdapter = {
  // --- Work Logs ---
  async getLogs(filters = {}) {
    let logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKLOGS) || "[]");

    if (filters.authorId) {
      logs = logs.filter(l => l.authorId === filters.authorId);
    }
    if (filters.unitId) {
      logs = logs.filter(l => l.unitId === filters.unitId);
    }
    if (filters.status) {
      logs = logs.filter(l => l.status === filters.status);
    }
    if (filters.startDate && filters.endDate) {
      logs = logs.filter(l =>
        l.logDate >= filters.startDate && l.logDate <= filters.endDate
      );
    }

    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async saveLog(log) {
    let logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKLOGS) || "[]");
    const index = logs.findIndex(l => l.id === log.id);

    if (index >= 0) {
      logs[index] = { ...logs[index], ...log, updatedAt: new Date().toISOString() };
    } else {
      logs.unshift({
        ...log,
        id: crypto.randomUUID(),
        status: "pending",
        version: 1,
        revisionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    localStorage.setItem(STORAGE_KEYS.WORKLOGS, JSON.stringify(logs));
    return logs[0] || log;
  },

  async updateLogStatus(logId, status, reviewData = {}) {
    let logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKLOGS) || "[]");
    const index = logs.findIndex(l => l.id === logId);
    if (index < 0) throw new Error("Log not found");

    if (status === "revision") {
      // Save snapshot first
      const revisions = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.WORKLOGS + "_revisions") || "[]"
      );
      revisions.push({
        logId,
        version: logs[index].version,
        snapshot: { ...logs[index] },
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.WORKLOGS + "_revisions", JSON.stringify(revisions));

      logs[index] = {
        ...logs[index],
        status,
        complexityScore: null,
        qualityScore: null,
        reviewComment: reviewData.comment,
        reviewerId: reviewData.reviewerId,
        reviewedAt: new Date().toISOString(),
        version: logs[index].version + 1,
      };
    } else if (status === "approved") {
      logs[index] = {
        ...logs[index],
        status,
        complexityScore: reviewData.complexity,
        qualityScore: reviewData.quality,
        reviewComment: reviewData.comment || logs[index].reviewComment,
        reviewerId: reviewData.reviewerId,
        reviewedAt: new Date().toISOString(),
      };
    } else {
      logs[index] = { ...logs[index], status, ...reviewData };
    }

    logs[index].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.WORKLOGS, JSON.stringify(logs));
    return logs[index];
  },

  // --- Monthly Reviews ---
  async getMonthlyReviews(filters = {}) {
    let reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHLY) || "[]");
    if (filters.userId) {
      reviews = reviews.filter(r => r.userId === filters.userId);
    }
    if (filters.period) {
      reviews = reviews.filter(r => r.period === filters.period);
    }
    return reviews;
  },

  async saveMonthlyReview(review) {
    let reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHLY) || "[]");
    const index = reviews.findIndex(
      r => r.userId === review.userId && r.period === review.period
    );

    if (index >= 0) {
      reviews[index] = { ...reviews[index], ...review };
    } else {
      reviews.push({
        ...review,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    localStorage.setItem(STORAGE_KEYS.MONTHLY, JSON.stringify(reviews));
    return review;
  },

  // --- Delegations ---
  async getDelegations(filters = {}) {
    let delegations = JSON.parse(localStorage.getItem(STORAGE_KEYS.PERSONNEL) || "[]");
    return delegations.filter(d => d.type === "delegation");
  },

  // --- Audit ---
  async getAuditLogs(filters = {}) {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || "[]");
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async saveAuditLog(log) {
    let logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || "[]");
    logs.unshift({
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
    return log;
  },
};

// ============================================
// SUPABASE ADAPTER (real backend)
// ============================================
let supabaseAdapter = null;

function getSupabaseAdapter() {
  if (supabaseAdapter) return supabaseAdapter;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  supabaseAdapter = {
    async getLogs(filters = {}) {
      let query = supabase.from("work_logs").select("*, profiles:author_id(full_name, title)");

      if (filters.authorId) query = query.eq("author_id", filters.authorId);
      if (filters.unitId) query = query.eq("unit_id", filters.unitId);
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.startDate && filters.endDate) {
        query = query.gte("log_date", filters.startDate).lte("log_date", filters.endDate);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      // Transform snake_case to camelCase for frontend compatibility
      return (data || []).map(l => ({
        id: l.id,
        authorId: l.author_id,
        unitId: l.unit_id,
        logDate: l.log_date,
        title: l.title,
        result: l.result,
        status: l.status,
        complexityScore: l.complexity_score,
        qualityScore: l.quality_score,
        reviewerId: l.reviewer_id,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
      }));
    },

    async saveLog(log) {
      const supabase = getSupabaseClient();
      const supabaseData = {
        author_id: log.authorId || authService.currentUser?.id,
        unit_id: log.unitId || authService.currentUser?.unitId,
        log_date: log.logDate,
        title: log.title,
        result: log.result,
        status: log.status || "pending",
      };

      if (log.id) {
        const { data, error } = await supabase
          .from("work_logs")
          .update(supabaseData)
          .eq("id", log.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("work_logs")
          .insert(supabaseData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },

    async updateLogStatus(logId, status, reviewData = {}) {
      const supabase = getSupabaseClient();

      if (status === "approved") {
        const { data, error } = await supabase.rpc("approve_work_log", {
          p_log_id: logId,
          p_complexity_score: reviewData.complexity,
          p_quality_score: reviewData.quality,
          p_comment: reviewData.comment || null,
        });
        if (error) throw error;
        return data;
      } else if (status === "revision") {
        const { data, error } = await supabase.rpc("reject_work_log", {
          p_log_id: logId,
          p_comment: reviewData.comment || "",
        });
        if (error) throw error;
        return data;
      }

      return { success: true };
    },

    async getDashboardSummary(unitId, startDate, endDate) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc("get_dashboard_summary", {
        p_unit_id: unitId || null,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      });
      if (error) throw error;
      return data;
    },
  };

  return supabaseAdapter;
}

// ============================================
// PUBLIC API
// ============================================
export function getAdapter() {
  if (currentAdapter) return currentAdapter;

  if (!APP_CONFIG.DEMO_MODE) {
    const sa = getSupabaseAdapter();
    if (sa) {
      currentAdapter = sa;
      console.log("Data adapter: SUPABASE");
      return currentAdapter;
    }
  }

  currentAdapter = demoAdapter;
  console.log("Data adapter: DEMO");
  return currentAdapter;
}

export function resetAdapter() {
  currentAdapter = null;
  supabaseAdapter = null;
}
