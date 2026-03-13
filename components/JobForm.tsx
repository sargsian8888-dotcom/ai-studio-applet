import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { translations } from '@/lib/translations';
import { Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface JobFormProps {
  job?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JobForm({ job, onClose, onSuccess }: JobFormProps) {
  const { user, language } = useStore();
  const t = translations[language];
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: job?.title || '',
    description: job?.description || '',
    requirements: job?.requirements || '',
    location: job?.location || '',
    salary_range: job?.salary_range || '',
    job_type: job?.job_type || 'full-time',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          // We can still proceed since the company was created and we have the ID
        }
      }

      const jobData = {
        company_id: companyId,
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        salary_range: formData.salary_range,
        job_type: formData.job_type,
        status: 'active',
      };

      if (job) {
        // Update existing job
        const { error: updateError } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', job.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new job
        const { error: insertError } = await supabase
          .from('jobs')
          .insert([jobData]);
        
        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving job:', err, JSON.stringify(err));
      setError(err.message || err.details || 'Failed to save job');
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
        className="w-full max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <h2 className="font-display text-2xl uppercase tracking-tighter text-gray-900 dark:text-white">
            {job ? t.editJob : t.postJob}
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

          <form id="job-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                Job Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="e.g. Senior Frontend Developer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="e.g. Yerevan, Armenia (or Remote)"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                  Salary Range
                </label>
                <input
                  type="text"
                  name="salary_range"
                  value={formData.salary_range}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="e.g. $50k - $80k"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                Job Type
              </label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                placeholder="Describe the role and responsibilities..."
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                Requirements
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                placeholder="List the required skills and experience..."
              />
            </div>

            {/* Media Upload Placeholder */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">
                Job Media (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-gray-400 dark:text-white/30 mb-3" />
                <p className="font-mono text-xs text-gray-600 dark:text-white/70">
                  Drag and drop images or video here, or click to browse
                </p>
                <p className="font-mono text-[10px] text-gray-400 dark:text-white/40 mt-1">
                  Supports JPG, PNG, MP4 (Max 10MB)
                </p>
              </div>
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
            form="job-form"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors font-mono text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {job ? 'Save Changes' : 'Post Job'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
