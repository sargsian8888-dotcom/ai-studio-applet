import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { translations } from '@/lib/translations';
import { Loader2, X, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { motion } from 'motion/react';

interface CompanyStoryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CompanyStoryForm({ onClose, onSuccess }: CompanyStoryFormProps) {
  const { user, language } = useStore();
  const t = translations[language];
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error('Not authenticated');

      // Get company ID for the user
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      let companyId = userData?.company_id;

      if (!companyId) {
        // Company not found, create one
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert([{ 
            name: user.user_metadata?.full_name || 'My Company',
            description: 'Company description'
          }])
          .select('id')
          .single();
          
        if (createError) throw createError;
        companyId = newCompany.id;

        // Update user with new company_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ company_id: companyId })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Failed to update user with company_id:', updateError);
        }
      }

      // In a real app, we would upload the media file to Supabase Storage here
      // and get the public URL. For now, we'll just mock it or use a placeholder.
      let mediaUrl = 'https://picsum.photos/seed/story/400/600';
      
      if (mediaFile) {
        // Mock upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // In reality:
        // const { data, error } = await supabase.storage.from('stories').upload(...)
        // mediaUrl = data.publicUrl
      }

      const storyData = {
        company_id: companyId,
        title: formData.title,
        description: formData.description,
        media_url: mediaUrl,
        media_type: mediaFile?.type.startsWith('video/') ? 'video' : 'image',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };

      const { error: insertError } = await supabase
        .from('company_stories')
        .insert([storyData]);
      
      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error('Error saving story:', err);
      setError(err.message || 'Failed to save story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <h2 className="font-display text-2xl uppercase tracking-tighter text-gray-900 dark:text-white">
            {t.addStory}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-white/50" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form id="story-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Media Upload */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                Story Media
              </label>
              
              {mediaPreview ? (
                <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black">
                  {mediaFile?.type.startsWith('video/') ? (
                    <video src={mediaPreview} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative w-full aspect-[9/16] rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer overflow-hidden group">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="flex gap-4 mb-4">
                    <div className="p-4 rounded-full bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="p-4 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                      <Video className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="font-mono text-xs text-gray-600 dark:text-white/70 px-6">
                    Tap to upload photo or video
                  </p>
                  <p className="font-mono text-[10px] text-gray-400 dark:text-white/40 mt-2">
                    9:16 aspect ratio recommended
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                Title (Optional)
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="e.g. Office Tour"
                maxLength={40}
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                placeholder="Add a short caption..."
                maxLength={100}
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-4 bg-gray-50 dark:bg-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-full border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-mono text-xs uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="story-form"
            disabled={loading || !mediaFile}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors font-mono text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Post Story
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
