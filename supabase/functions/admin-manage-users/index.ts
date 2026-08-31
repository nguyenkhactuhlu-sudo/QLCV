// Edge Function: admin-manage-users
// Ngay: 30/08/2026
//
// Cho phep Quan tri vien/Vien truong tinh: (1) tao tai khoan moi va (2) dat
// lai mat khau cho nguoi khac, NGAY TREN GIAO DIEN - khong con phai vao
// Supabase SQL Editor viet SQL tay (khong kha thi khi ban giao cho don vi
// su dung, toan nguoi khong ranh ky thuat).
//
// VI SAO PHAI QUA EDGE FUNCTION: Supabase khong cho phep 1 nguoi dung
// thuong (du la admin, dung anon key) tu tao tai khoan auth moi hay dat
// mat khau cho NGUOI KHAC truc tiep tu trinh duyet - 2 viec nay can Admin
// API (auth.admin.createUser/updateUserById), CHI goi duoc bang SERVICE
// ROLE KEY (khoa toan quyen). Khoa nay duoc dat lam bien moi truong RIENG
// cua function nay (qua `supabase secrets set`), KHONG BAO GIO nam trong
// production/app.js hay bat ky file nao commit len git - lo ra la mat
// toan bo du lieu (bo qua moi RLS).
//
// Luong xu ly: dung ANON KEY + JWT cua nguoi goi de xac thuc dung ho la
// ai va tra profiles.role/is_active cua CHINH HO (qua RLS binh thuong,
// khong can quyen dac biet o buoc nay) - chi khi dung la
// administrator/province_head dang hoat dong moi duoc di tiep. Sau do
// moi dung client THU HAI (SERVICE ROLE) de thuc su thao tac.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return json({ success: false, error: "Not authenticated" }, 401);

  // Buoc 1: xac thuc nguoi goi bang ANON KEY + JWT cua chinh ho (khong co
  // dac quyen gi them o day - RLS binh thuong, chi tu xem duoc ho so cua
  // chinh minh, dung du de kiem tra role/is_active).
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authError } = await callerClient.auth.getUser(jwt);
  if (authError || !userData?.user) return json({ success: false, error: "Not authenticated" }, 401);

  const { data: callerProfile, error: profileError } = await callerClient
    .from("profiles")
    .select("role, is_active")
    .eq("id", userData.user.id)
    .single();
  if (
    profileError ||
    !callerProfile?.is_active ||
    !["administrator", "province_head"].includes(callerProfile.role)
  ) {
    return json({ success: false, error: "Không có quyền thực hiện thao tác này" }, 403);
  }

  // Buoc 2: tu day moi dung SERVICE ROLE - toan quyen, chi chay o day,
  // khong bao gio ve toi trinh duyet.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Payload không hợp lệ" }, 400);
  }

  if (body.action === "create_user") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.full_name || "").trim();
    const role = String(body.role || "");
    const unitId = String(body.unit_id || "");
    const title = body.title ? String(body.title) : null;
    const professionalTitle = body.professional_title ? String(body.professional_title) : null;

    if (!email || !password || !fullName || !role || !unitId) {
      return json({ success: false, error: "Vui lòng nhập đủ email, mật khẩu, họ tên, vai trò, đơn vị" });
    }
    if (password.length < 8) {
      return json({ success: false, error: "Mật khẩu cần tối thiểu 8 ký tự" });
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return json({ success: false, error: "Mật khẩu cần có cả chữ và số" });
    }
    // Lo hong bao mat da vay (30/08/2026): truoc day khong kiem tra "role"
    // dinh gan la gi - Vien truong tinh (khong phai Quan tri vien) co the
    // tu tao 1 tai khoan Quan tri vien moi. Chi Quan tri vien moi duoc tao
    // tai khoan Quan tri vien khac.
    if (role === "administrator" && callerProfile.role !== "administrator") {
      return json({ success: false, error: "Chỉ Quản trị viên mới được tạo tài khoản Quản trị viên" }, 403);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // khong gui email xac nhan (domain gia @vks-test.local khong nhan duoc), coi nhu da xac nhan luon
      user_metadata: { full_name: fullName },
    });
    if (createError) return json({ success: false, error: createError.message });

    // Trigger handle_new_user() da tu tao 1 dong profiles voi
    // role=staff/is_active=false - sua lai ngay cho dung, giong het cach
    // _seed_test_account lam bang SQL bay lau.
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        role,
        unit_id: unitId,
        is_active: true,
        title,
        professional_title: professionalTitle,
      })
      .eq("id", created.user.id);
    if (updateError) return json({ success: false, error: updateError.message });

    return json({ success: true, user_id: created.user.id });
  }

  if (body.action === "set_password") {
    const userId = String(body.user_id || "");
    const newPassword = String(body.new_password || "");
    if (!userId || !newPassword) return json({ success: false, error: "Thiếu thông tin" });
    if (newPassword.length < 8) return json({ success: false, error: "Mật khẩu cần tối thiểu 8 ký tự" });
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return json({ success: false, error: "Mật khẩu cần có cả chữ và số" });
    }

    // Lo hong bao mat da vay (30/08/2026): truoc day KHONG kiem tra dang
    // dat lai mat khau cua AI - Vien truong tinh (khong phai Quan tri
    // vien) co the dat lai mat khau cua bat ky tai khoan nao, ke ca
    // Quan tri vien, roi tu dang nhap chiem quyen. Chi Quan tri vien moi
    // duoc dung vao tai khoan Quan tri vien/Vien truong tinh khac.
    const { data: targetProfile, error: targetError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (targetError || !targetProfile) return json({ success: false, error: "Không tìm thấy tài khoản" });
    if (
      callerProfile.role !== "administrator" &&
      ["administrator", "province_head"].includes(targetProfile.role)
    ) {
      return json({ success: false, error: "Không có quyền đặt lại mật khẩu của tài khoản này" }, 403);
    }

    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return json({ success: false, error: error.message });

    return json({ success: true });
  }

  return json({ success: false, error: "Thao tác không hợp lệ" }, 400);
});
