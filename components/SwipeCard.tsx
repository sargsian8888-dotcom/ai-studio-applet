'use client';

import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useState, useEffect } from 'react';
import { Check, X, Sparkles, PlayCircle, Trophy } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company_name: string;
  description: string;
  salary_range: string;
  location: string;
  vibe_score?: number; // AI Vibe Check score
  audio_url?: string; // Voice prompt URL
  quests?: any[]; // Skill Quests
}

interface SwipeCardProps {
  job: Job;
  onSwipe: (direction: 'left' | 'right', jobId: string) => void;
}

export default function SwipeCard({ job, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);

  const [exitX, setExitX] = useState<number | null>(null);

  // Vibe Check Animation
  const [vibeScore, setVibeScore] = useState(0);
  useEffect(() => {
    if (job.vibe_score) {
      const controls = animate(0, job.vibe_score, {
        duration: 1.5,
        onUpdate: (value) => setVibeScore(Math.round(value)),
        ease: 'easeOut',
      });
      return controls.stop;
    }
  }, [job.vibe_score]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      setExitX(300);
      onSwipe('right', job.id);
    } else if (info.offset.x < -threshold) {
      setExitX(-300);
      onSwipe('left', job.id);
    }
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    setExitX(direction === 'right' ? 300 : -300);
    onSwipe(direction, job.id);
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, scale }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX ? { x: exitX, opacity: 0, scale: 0.8 } : { x: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute w-full max-w-md h-[75vh] rounded-[2rem] bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
    >
      {/* Immersive Background / Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,80,20,0.2),transparent_60%)] z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />

      {/* Vibe Check Badge */}
      {job.vibe_score && (
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full glass-panel">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">
            {vibeScore}% Match
          </span>
        </div>
      )}

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 z-20 flex flex-col gap-6">
        <div>
          <h2 className="font-display text-5xl uppercase leading-[0.9] tracking-tighter text-white mb-2">
            {job.title}
          </h2>
          <p className="font-mono text-sm text-orange-500 uppercase tracking-widest">
            {job.company_name}
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-white/60">
          <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
            {job.location}
          </span>
          <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
            {job.salary_range}
          </span>
        </div>

        <div className="h-32 overflow-y-auto pr-2 scrollbar-thin">
          <p className="text-sm leading-relaxed text-white/70 font-sans">
            {job.description}
          </p>
        </div>

        {/* Voice Prompt Feature */}
        {job.audio_url && (
          <button className="w-full flex items-center justify-center gap-3 py-4 rounded-full glass-panel hover:bg-white/10 transition-colors text-white font-mono text-xs uppercase tracking-widest">
            <PlayCircle className="w-4 h-4 text-orange-500" />
            Listen to Intro
          </button>
        )}

        {/* Skill Quest Indicator */}
        {job.quests && job.quests.length > 0 && (
          <div className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-mono text-[10px] uppercase tracking-widest">
            <Trophy className="w-4 h-4" />
            Skill Quest Required
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <button
            onClick={() => handleButtonSwipe('left')}
            className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em]">
            Swipe
          </div>

          <button
            onClick={() => handleButtonSwipe('right')}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <Check className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
