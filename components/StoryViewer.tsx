import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: string;
  company: {
    name: string;
    logo_url: string;
  };
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stories.length === 0) return;

    const currentStory = stories[currentIndex];
    const duration = currentStory.media_type === 'video' ? 15000 : 5000; // 15s for video, 5s for image
    const interval = 50; // Update every 50ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, stories]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  if (stories.length === 0) return null;

  const currentStory = stories[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      >
        <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl overflow-hidden bg-gray-900">
          {/* Progress Bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
            {stories.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{
                    width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-white">
                <img
                  src={currentStory.company?.logo_url || `https://ui-avatars.com/api/?name=${currentStory.company?.name || 'C'}`}
                  alt={currentStory.company?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-mono text-sm text-white font-bold drop-shadow-md">
                {currentStory.company?.name}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media */}
          <div className="w-full h-full relative">
            {currentStory.media_type === 'video' ? (
              <video
                src={currentStory.media_url}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <img
                src={currentStory.media_url}
                alt={currentStory.title}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
          </div>

          {/* Content */}
          <div className="absolute bottom-12 left-6 right-6 z-20">
            {currentStory.title && (
              <h2 className="font-display text-2xl text-white mb-2 drop-shadow-lg">
                {currentStory.title}
              </h2>
            )}
            {currentStory.description && (
              <p className="font-sans text-sm text-white/90 drop-shadow-md">
                {currentStory.description}
              </p>
            )}
          </div>

          {/* Navigation Overlay */}
          <div className="absolute inset-0 z-10 flex">
            <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
            <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
