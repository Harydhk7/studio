import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET ?? "uploads";

export const supabase =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

export function getStorageBucket(): string {
  return bucket;
}

/** Create the uploads bucket if it doesn't exist (call at startup so uploads work). */
export async function ensureUploadBucket(): Promise<void> {
  if (!supabase) return;
  const bucketName = getStorageBucket();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === bucketName)) return;
  const { error } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  });
  if (error) {
    console.warn(`[supabase] Could not create bucket "${bucketName}":`, error.message);
  }
}
