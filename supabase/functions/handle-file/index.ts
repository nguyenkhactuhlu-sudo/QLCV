// Supabase Edge Function: handle-file upload/download/delete
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const bucket = "attachments";

    if (body.action === "upload") {
      const filePath = `${user.id}/${body.logId}/${Date.now()}_${body.fileName}`;
      const { data, error } = await supabase.storage.from(bucket).upload(
        filePath,
        Uint8Array.from(atob(body.fileData), c => c.charCodeAt(0)),
        { contentType: body.fileType || "application/octet-stream" }
      );
      if (error) throw error;

      const { data: attachment, error: insertError } = await supabase
        .from("attachments").insert({
          log_id: body.logId, file_name: body.fileName,
          file_size: Math.round((body.fileData.length * 3) / 4),
          mime_type: body.fileType || "application/octet-stream",
          storage_provider: "supabase", storage_path: filePath,
          uploaded_by: user.id,
        }).select().single();
      if (insertError) throw insertError;
      return new Response(JSON.stringify({ success: true, attachment }));
    }

    if (body.action === "download") {
      const { data: att, error: fe } = await supabase
        .from("attachments").select("*").eq("id", body.fileId).single();
      if (fe || !att) throw new Error("File not found");
      const { data: fileData, error: de } = await supabase.storage
        .from(bucket).download(att.storage_path);
      if (de) throw de;
      return new Response(fileData, {
        headers: {
          "Content-Type": att.mime_type,
          "Content-Disposition": `attachment; filename="${att.file_name}"`,
        },
      });
    }

    if (body.action === "delete") {
      const { data: att } = await supabase
        .from("attachments").select("*").eq("id", body.fileId).single();
      if (!att) throw new Error("File not found");
      await supabase.storage.from(bucket).remove([att.storage_path]);
      await supabase.from("attachments").update({ is_deleted: true }).eq("id", body.fileId);
      return new Response(JSON.stringify({ success: true }));
    }

    throw new Error(`Unknown action: ${body.action}`);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
