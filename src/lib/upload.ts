import { createClient } from "@/lib/supabase/client";

export async function uploadImage(file: File) {
  const supabase = createClient();

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("autolink-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("autolink-images")
    .getPublicUrl(fileName);

  return publicUrl;
}