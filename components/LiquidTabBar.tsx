'use client';

import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface LiquidTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function LiquidTabBar({ tabs, activeTab, onTabChange }: LiquidTabBarProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        className="flex items-center gap-2 p-3 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseLeave={() => setHoveredTab(null)}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          const Icon = tab.icon;

          return (
            <div key={tab.id} className="relative group">
              <motion.button
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                className={`relative p-3 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
                }`}
                animate={{
                  scale: isHovered ? 1.2 : isActive ? 1.1 : 1,
                  y: isHovered ? -8 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBubble"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-6 h-6 relative z-10" />
                {tab.badge && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white z-20 border-2 border-black">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </div>
                )}
              </motion.button>
              
              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] uppercase tracking-widest rounded-lg pointer-events-none whitespace-nowrap border border-white/10"
                  >
                    {tab.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
