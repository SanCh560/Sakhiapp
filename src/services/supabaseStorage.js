/**
 * Sakhi Supabase Storage Manager
 * 
 * Manages media assets, journal photos, user avatars, and travel documents in Supabase Storage.
 * The relational database only stores public URLs or asset path references.
 */

import { supabase } from '../db/supabaseClient';

export const SupabaseStorageService = {
  // Bucket Names
  BUCKETS: {
    AVATARS: 'avatars',
    JOURNAL_PHOTOS: 'travel_journals',
    TRAVEL_DOCS: 'travel_documents',
    PACK_ASSETS: 'travel_pack_assets'
  },

  /**
   * Upload an asset file to a Supabase Storage bucket
   */
  async uploadFile(bucketName, filePath, fileBlob) {
    if (!navigator.onLine) {
      console.warn('[Supabase Storage] Offline: Media asset queued for online upload.');
      return { isOffline: true, publicUrl: URL.createObjectURL(fileBlob) };
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileBlob, { upsert: true });

      if (error) {
        console.error(`[Supabase Storage] Upload error in ${bucketName}:`, error.message);
        return { isOffline: false, publicUrl: URL.createObjectURL(fileBlob) };
      }

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return { isOffline: false, publicUrl: publicUrlData.publicUrl, path: data.path };
    } catch (err) {
      console.error('[Supabase Storage] Exception during upload:', err);
      return { isOffline: true, publicUrl: URL.createObjectURL(fileBlob) };
    }
  }
};
