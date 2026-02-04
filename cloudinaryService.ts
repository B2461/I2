
/**
 * CLOUDINARY SERVICE REMOVED
 * Storage has been migrated to Supabase.
 * Please use supabaseService.ts for all media uploads.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
    throw new Error("Cloudinary service is disabled. Use Supabase instead.");
};
