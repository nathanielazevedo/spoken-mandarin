import { createClient } from '@supabase/supabase-js';

const AUDIO_BUCKET = 'audio';

/**
 * Create a Supabase client with the service role key for storage operations.
 * This bypasses RLS policies for uploading files.
 */
function createStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or service role key for storage operations');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export interface UploadAudioResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload an audio file to Supabase Storage.
 * 
 * @param buffer - The audio file buffer
 * @param folder - The folder within the audio bucket (e.g., 'vocabulary', 'sentences')
 * @param filename - The filename (e.g., 'vocab-id.mp3')
 * @returns The public URL and storage path
 */
export async function uploadAudioToStorage(
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<UploadAudioResult> {
  const supabase = createStorageClient();
  const storagePath = `${folder}/${filename}`;

  // Upload to Supabase Storage, upsert to replace existing files
  const { error: uploadError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error(`Failed to upload audio: ${uploadError.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(AUDIO_BUCKET)
    .getPublicUrl(storagePath);

  return {
    publicUrl: publicUrlData.publicUrl,
    path: storagePath,
  };
}

/**
 * Delete an audio file from Supabase Storage.
 * 
 * @param storagePath - The full path within the bucket (e.g., 'vocabulary/vocab-id.mp3')
 */
export async function deleteAudioFromStorage(storagePath: string): Promise<void> {
  const supabase = createStorageClient();

  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error('Storage delete error:', error);
    throw new Error(`Failed to delete audio: ${error.message}`);
  }
}
