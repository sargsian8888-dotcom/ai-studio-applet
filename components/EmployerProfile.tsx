'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { translations } from '@/lib/translations';
import { motion } from 'motion/react';
import { Settings, Building2, MapPin, Globe, Shield, Moon, Sun } from 'lucide-react';
import PrivacyPolicyModal from './PrivacyPolicyModal';

export default function EmployerProfile() {
  const { user, language, theme, setLanguage, setTheme, logout } = useStore();
  const t = translations[language];
  
  const [activeSection, setActiveSection] = useState<'profile' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Mock form state
  const [formData, setFormData] = useState({
    companyName: user?.user_metadata?.full_name || 'Tech Innovators Inc.',
    industry: 'Software Development',
    companySize: '50-200 employees',
    website: 'https://techinnovators.com',
    address: 'Yerevan, Armenia'
  });

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto pb-32">
      {/* Header Tabs */}
      <div className="flex gap-4 p-6 border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setActiveSection('profile')}
          className={`flex-1 py-3 rounded-full font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
            activeSection === 'profile'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-gray-900 dark:border-white'
              : 'bg-transparent text-gray-500 dark:text-white/50 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30'
          }`}
        >
          <Building2 className="w-4 h-4" />
          {t.profile}
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`flex-1 py-3 rounded-full font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
            activeSection === 'settings'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-gray-900 dark:border-white'
              : 'bg-transparent text-gray-500 dark:text-white/50 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30'
          }`}
        >
          <Settings className="w-4 h-4" />
          {t.settings}
        </button>
      </div>

      <div className="p-6">
        {activeSection === 'profile' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl uppercase tracking-tighter text-gray-900 dark:text-white">{t.companyInfo}</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-orange-500 font-mono text-xs uppercase tracking-widest hover:text-orange-600"
              >
                {isEditing ? t.save : t.edit}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2">{t.companyName}</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2">{t.industry}</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2">{t.companySize}</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.companySize}
                    onChange={(e) => setFormData({...formData, companySize: e.target.value})}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2">{t.website}</label>
                <input 
                  type="url" 
                  disabled={!isEditing}
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-white/10">
              <h2 className="font-display text-2xl uppercase tracking-tighter text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-orange-500" />
                {t.address}
              </h2>
              <div className="space-y-4">
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                />
                
                {/* Yandex Map */}
                <div className="w-full h-48 bg-gray-200 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 flex items-center justify-center overflow-hidden relative">
                  <iframe 
                    src={`https://yandex.com/map-widget/v1/?text=${encodeURIComponent(formData.address || 'Yerevan, Armenia')}`} 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    allowFullScreen={true}
                    className="absolute inset-0"
                  ></iframe>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <h2 className="font-display text-2xl uppercase tracking-tighter text-gray-900 dark:text-white">{t.settings}</h2>
            
            <div className="space-y-6">
              {/* Language */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-sm text-gray-900 dark:text-white uppercase tracking-widest">{t.language}</span>
                </div>
                <div className="flex bg-gray-100 dark:bg-black rounded-full p-1 border border-gray-200 dark:border-white/10">
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${language === 'en' ? 'bg-white dark:bg-white/20 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50'}`}
                  >
                    EN
                  </button>
                  <button 
                    onClick={() => setLanguage('am')}
                    className={`px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${language === 'am' ? 'bg-white dark:bg-white/20 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50'}`}
                  >
                    AM
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-500/10 text-orange-500">
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <span className="font-mono text-sm text-gray-900 dark:text-white uppercase tracking-widest">{t.theme}</span>
                </div>
                <div className="flex bg-gray-100 dark:bg-black rounded-full p-1 border border-gray-200 dark:border-white/10">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${theme === 'light' ? 'bg-white dark:bg-white/20 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50'}`}
                  >
                    {t.light}
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${theme === 'dark' ? 'bg-white dark:bg-white/20 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50'}`}
                  >
                    {t.dark}
                  </button>
                </div>
              </div>

              {/* Privacy Policy */}
              <button 
                onClick={() => setIsPrivacyModalOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-sm text-gray-900 dark:text-white uppercase tracking-widest">{t.privacyPolicy}</span>
                </div>
              </button>

              {/* Sign Out */}
              <button 
                onClick={logout}
                className="w-full mt-8 py-4 rounded-full bg-red-500/10 text-red-500 font-mono text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
              >
                {t.signOut}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <PrivacyPolicyModal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => setIsPrivacyModalOpen(false)} 
      />
    </div>
  );
}
