
import { createClient } from '@supabase/supabase-js';

// User provided credentials
const SUPABASE_URL = 'https://hwicdmuvrgbrsgnfpcdy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OJYOj1MbOkyttozZKX-cAQ_yc69YI12';
const BUCKET_NAME = 'Ok_e_store';

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * Handles both images and videos.
 */
export const uploadToSupabase = async (file: File): Promise<string> => {
    // 1. Create a unique path for the file (e.g., inventory/17123456789_myfile.png)
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `inventory/${fileName}`;

    try {
        // 2. Upload file to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        // 3. Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        if (!publicUrlData.publicUrl) {
            throw new Error('Public URL generation failed');
        }

        return publicUrlData.publicUrl;
    } catch (error: any) {
        console.error('Supabase Storage Error:', error.message || error);
        throw new Error(`सुपरबेस स्टोरेज में अपलोड विफल: ${error.message}`);
    }
};
