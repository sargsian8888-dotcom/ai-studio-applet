'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Trophy, ArrowRight, Play } from 'lucide-react';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'multiple_choice' | 'code_snippet' | 'scenario';
  options?: string[];
  correctAnswer?: string;
  timeLimit?: number; // in seconds
}

interface SkillQuestProps {
  jobId: string;
  companyName: string;
  quests: Quest[];
  onComplete: (score: number, passed: boolean) => void;
  onCancel: () => void;
}

export default function SkillQuest({ jobId, companyName, quests, onComplete, onCancel }: SkillQuestProps) {
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const currentQuest = quests[currentQuestIndex];

  const handleStart = () => {
    setHasStarted(true);
  };

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentQuest.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestIndex < quests.length - 1) {
        setCurrentQuestIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setIsFinished(true);
      }
    }, 1500);
  };

  const handleFinish = () => {
    const passed = score >= Math.ceil(quests.length / 2); // Pass if >= 50%
    onComplete(score, passed);
  };

  if (!hasStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute inset-0 z-50 flex flex-col bg-[#050505] p-6"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full border border-orange-500/30 flex items-center justify-center bg-orange-500/10 mb-8">
            <Trophy className="w-12 h-12 text-orange-500" />
          </div>
          <h2 className="font-display text-4xl uppercase tracking-tighter text-white mb-4">
            Skill Quest
          </h2>
          <p className="font-mono text-sm text-white/60 uppercase tracking-widest mb-8 max-w-xs">
            {companyName} requires a quick vibe check to proceed with your application.
          </p>
          <div className="flex gap-4 w-full max-w-xs">
            <button
              onClick={onCancel}
              className="flex-1 py-4 rounded-full border border-white/10 text-white font-mono text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              Skip
            </button>
            <button
              onClick={handleStart}
              className="flex-1 py-4 rounded-full bg-orange-500 text-white font-mono text-xs uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isFinished) {
    const passed = score >= Math.ceil(quests.length / 2);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 z-50 flex flex-col bg-[#050505] p-6"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className={`w-24 h-24 rounded-full border flex items-center justify-center mb-8 ${passed ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
            {passed ? <CheckCircle2 className="w-12 h-12 text-green-500" /> : <XCircle className="w-12 h-12 text-red-500" />}
          </div>
          <h2 className="font-display text-4xl uppercase tracking-tighter text-white mb-2">
            {passed ? 'Quest Passed!' : 'Quest Failed'}
          </h2>
          <p className="font-mono text-sm text-white/60 uppercase tracking-widest mb-8">
            Score: {score} / {quests.length}
          </p>
          <button
            onClick={handleFinish}
            className="w-full max-w-xs py-4 rounded-full bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all"
          >
            Continue
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 z-50 flex flex-col bg-[#050505] p-6"
    >
      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestIndex) / quests.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <span className="font-mono text-xs text-orange-500 uppercase tracking-widest mb-4">
          Question {currentQuestIndex + 1} of {quests.length}
        </span>
        <h3 className="font-display text-2xl uppercase tracking-tighter text-white mb-8">
          {currentQuest.title}
        </h3>
        
        <p className="text-white/80 font-sans text-lg mb-8 leading-relaxed">
          {currentQuest.description}
        </p>

        <div className="space-y-3 mt-auto mb-8">
          <AnimatePresence mode="wait">
            {currentQuest.options?.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuest.correctAnswer;
              
              let buttonStyle = "border-white/10 hover:border-white/30 bg-transparent text-white";
              if (showResult) {
                if (isCorrect) buttonStyle = "border-green-500 bg-green-500/10 text-green-400";
                else if (isSelected && !isCorrect) buttonStyle = "border-red-500 bg-red-500/10 text-red-400";
                else buttonStyle = "border-white/5 bg-transparent text-white/30";
              } else if (isSelected) {
                buttonStyle = "border-orange-500 bg-orange-500/10 text-orange-400";
              }

              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  className={`w-full p-4 rounded-2xl border text-left font-sans transition-all flex items-center justify-between ${buttonStyle}`}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                >
                  <span>{option}</span>
                  {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
