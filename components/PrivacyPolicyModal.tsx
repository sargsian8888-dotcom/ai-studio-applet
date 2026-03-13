import { motion, AnimatePresence } from 'motion/react';
import { X, Shield } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { translations } from '@/lib/translations';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  const { language } = useStore();
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="font-display text-2xl uppercase tracking-tighter text-gray-900 dark:text-white">
                {t.privacyPolicy}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-white/50" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto font-sans text-gray-700 dark:text-white/80 space-y-4">
            <h3 className="font-bold text-lg">1. Data Collection</h3>
            <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.</p>
            
            <h3 className="font-bold text-lg">2. Use of Information</h3>
            <p>We may use the information we collect about you to: Provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support to Users and Drivers, develop safety features, authenticate users, and send product updates and administrative messages.</p>
            
            <h3 className="font-bold text-lg">3. Sharing of Information</h3>
            <p>We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows: With Drivers to enable them to provide the Services you request. For example, we share your name, photo (if you provide one), average User rating given by Drivers, and pickup and/or drop-off locations with Drivers.</p>
            
            <h3 className="font-bold text-lg">4. Data Security</h3>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
            
            <p className="text-sm text-gray-500 dark:text-white/50 mt-8">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black font-mono text-xs uppercase tracking-widest hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
