'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { translations } from '@/lib/translations';
import SwipeCard from './SwipeCard';
import SkillQuest from './SkillQuest';
import LiquidTabBar from './LiquidTabBar';
import CandidateProfile from './CandidateProfile';
import StoryViewer from './StoryViewer';
import ChatInterface from './ChatInterface';
import { Loader2, LogOut, MessageCircle, User as UserIcon, Sparkles, Layers, Heart, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CandidatePortal() {
  const { user, language, logout } = useStore();
  const t = translations[language];
  const [jobs, setJobs] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeQuest, setActiveQuest] = useState<{ jobId: string, companyName: string, quests: any[] } | null>(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [matches, setMatches] = useState<any[]>([]);
  const [chatUser, setChatUser] = useState<any | null>(null);
  const [latestMessages, setLatestMessages] = useState<Record<string, any>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const candidateTabs = [
    { id: 'feed', label: t.feed, icon: Layers },
    { id: 'matches', label: t.matches, icon: Heart },
    { 
      id: 'messages', 
      label: t.messages, 
      icon: MessageSquare,
      badge: Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 
        ? Object.values(unreadCounts).reduce((a, b) => a + b, 0) 
        : undefined
    },
    { id: 'profile', label: t.profile, icon: UserIcon },
  ];

  // Fetch latest messages and unread counts
  useEffect(() => {
    if (!user?.id) return;

    const fetchMessagesData = async () => {
      // Fetch all matches for this candidate
      const { data: matches } = await supabase
        .from('matches')
        .select('id, application_id')
        .eq('candidate_id', user.id);

      if (!matches || matches.length === 0) return;

      const matchIds = matches.map(m => m.id);

      // Fetch latest message for each match
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

      if (messages) {
        const latest: Record<string, any> = {};
        const unread: Record<string, number> = {};

        messages.forEach(msg => {
          const match = matches.find(m => m.id === msg.match_id);
          if (!match) return;
          const appId = match.application_id;

          if (!latest[appId]) {
            latest[appId] = msg;
          }

          if (msg.sender_id !== user.id && !msg.read_at) {
            unread[appId] = (unread[appId] || 0) + 1;
          }
        });

        setLatestMessages(latest);
        setUnreadCounts(unread);
      }
    };

    fetchMessagesData();

    // Subscribe to new messages
    const channel = supabase
      .channel('candidate_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchMessagesData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchMatches = useCallback(async () => {
    try {
      const { data: apps, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            company_id,
            companies (
              id,
              name
            )
          )
        `)
        .eq('candidate_id', user?.id)
        .eq('status', 'accepted');

      if (error) throw error;
      setMatches(apps || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  }, [user?.id]);

  const fetchJobs = useCallback(async () => {
    try {
      const { data: appliedJobs } = await supabase
        .from('applications')
        .select('job_id')
        .eq('candidate_id', user?.id);

      const appliedJobIds = appliedJobs?.map((app) => app.job_id) || [];
      
      // Get skipped jobs from localStorage
      let skippedJobIds: string[] = [];
      try {
        skippedJobIds = JSON.parse(localStorage.getItem('skippedJobs') || '[]');
      } catch (e) {
        console.error('Error parsing skipped jobs', e);
      }

      // Get applied jobs from localStorage (fallback)
      let localAppliedJobIds: string[] = [];
      try {
        localAppliedJobIds = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
      } catch (e) {
        console.error('Error parsing applied jobs', e);
      }
      
      const allExcludedIds = [...appliedJobIds, ...skippedJobIds, ...localAppliedJobIds];

      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (name)
        `)
        .eq('status', 'active');

      if (allExcludedIds.length > 0) {
        query = query.not('id', 'in', `(${allExcludedIds.join(',')})`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      const jobsWithVibe = data.map((job) => {
        // Deterministic pseudo-random based on job ID
        const hash = job.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const vibeScore = (hash % 40) + 60;
        const hasQuests = (hash % 2) === 0;

        return {
          ...job,
          company_name: job.companies?.name || 'Unknown Company',
          vibe_score: vibeScore,
          // Mock quests for demonstration
          quests: hasQuests ? [
            {
              id: 'q1',
              title: 'React Fundamentals',
              description: 'What is the primary purpose of the useEffect hook?',
              type: 'multiple_choice',
              options: ['To manage local state', 'To perform side effects', 'To render UI components', 'To handle routing'],
              correctAnswer: 'To perform side effects'
            },
            {
              id: 'q2',
              title: 'CSS Architecture',
              description: 'Which utility-first CSS framework is known for its extensive set of classes?',
              type: 'multiple_choice',
              options: ['Bootstrap', 'Materialize', 'Tailwind CSS', 'Bulma'],
              correctAnswer: 'Tailwind CSS'
            }
          ] : null
        };
      });

      setJobs(jobsWithVibe);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchStories = useCallback(async () => {
    try {
      // Fetch stories from companies the user has applied to (or all for now)
      const { data, error } = await supabase
        .from('company_stories')
        .select(`
          *,
          company:companies (name, logo_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchJobs();
    } else if (activeTab === 'messages' || activeTab === 'matches') {
      fetchStories();
      fetchMatches();
    }
  }, [activeTab, fetchJobs, fetchStories, fetchMatches]);

  const handleSwipe = async (direction: 'left' | 'right', jobId: string) => {
    const currentJob = jobs[currentIndex];

    if (direction === 'right') {
      if (currentJob.quests && currentJob.quests.length > 0) {
        setActiveQuest({
          jobId: currentJob.id,
          companyName: currentJob.company_name,
          quests: currentJob.quests
        });
        return; // Don't advance index yet, wait for quest completion
      } else {
        await applyForJob(jobId, null);
      }
    } else if (direction === 'left') {
      try {
        const { error } = await supabase.from('applications').insert([
          {
            job_id: jobId,
            candidate_id: user?.id,
            status: 'rejected',
          },
        ]);
        if (error) {
           // If status column doesn't exist or other error, fallback to localStorage
           const skippedJobs = JSON.parse(localStorage.getItem('skippedJobs') || '[]');
           skippedJobs.push(jobId);
           localStorage.setItem('skippedJobs', JSON.stringify(skippedJobs));
        }
      } catch (error) {
        console.error('Error skipping job:', error);
        const skippedJobs = JSON.parse(localStorage.getItem('skippedJobs') || '[]');
        skippedJobs.push(jobId);
        localStorage.setItem('skippedJobs', JSON.stringify(skippedJobs));
      }
    }

    advanceCard();
  };

  const applyForJob = async (jobId: string, questScore: number | null) => {
    try {
      const { error } = await supabase.from('applications').insert([
        {
          job_id: jobId,
          candidate_id: user?.id,
          status: 'pending',
        },
      ]);
      if (error) {
        if (error.message?.includes('applications_candidate_id_fkey')) {
          // User doesn't exist in users table, try to create them
          const { error: userInsertError } = await supabase.from('users').upsert([
            {
              id: user?.id,
              email: user?.email || '',
              full_name: user?.user_metadata?.full_name || 'Candidate',
              role: 'candidate',
            },
          ], { onConflict: 'id' });
          
          if (!userInsertError) {
            // Retry application if user creation succeeded
            const { error: retryError } = await supabase.from('applications').insert([
              {
                job_id: jobId,
                candidate_id: user?.id,
                status: 'pending',
              },
            ]);
            if (!retryError) return;
          }
        }

        // Try without status column if it doesn't exist or if retry failed
        const { error: fallbackError } = await supabase.from('applications').insert([
          {
            job_id: jobId,
            candidate_id: user?.id,
          },
        ]);
        if (fallbackError) throw fallbackError;
      }
    } catch (error: any) {
      console.error('Error applying for job:', error?.message || error);
      // Fallback to localStorage if database insert fails
      try {
        const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
        appliedJobs.push(jobId);
        localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
      } catch (e) {
        console.error('Error saving applied job to localStorage', e);
      }
    }
  };

  const advanceCard = () => {
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 300);
  };

  const handleQuestComplete = async (score: number, passed: boolean) => {
    if (activeQuest) {
      if (passed) {
        await applyForJob(activeQuest.jobId, score);
      }
      setActiveQuest(null);
      advanceCard();
    }
  };

  const handleQuestCancel = () => {
    setActiveQuest(null);
    advanceCard(); // Skip the job if quest is cancelled
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  if (loading && activeTab === 'feed') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden bg-gray-50 dark:bg-[#050505] pb-24 transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-6 z-10 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl uppercase tracking-tighter text-gray-900 dark:text-white">
            Qayl
          </h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="p-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-5 h-5 text-gray-900 dark:text-white/80" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 relative ${activeTab === 'feed' ? 'flex items-center justify-center p-4' : 'overflow-y-auto'}`}>
        {activeTab === 'feed' && (
          <AnimatePresence>
            {activeQuest && (
              <SkillQuest
                key="quest"
                jobId={activeQuest.jobId}
                companyName={activeQuest.companyName}
                quests={activeQuest.quests}
                onComplete={handleQuestComplete}
                onCancel={handleQuestCancel}
              />
            )}
            {!activeQuest && currentIndex < jobs.length ? (
              <SwipeCard
                key={jobs[currentIndex].id}
                job={jobs[currentIndex]}
                onSwipe={handleSwipe}
              />
            ) : !activeQuest && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 w-full"
              >
                <div className="w-20 h-20 mx-auto mb-8 rounded-full border border-orange-500/30 flex items-center justify-center bg-orange-500/10">
                  <Sparkles className="w-10 h-10 text-orange-500" />
                </div>
                <h2 className="font-display text-4xl uppercase tracking-tighter text-gray-900 dark:text-white mb-4">
                  {t.youAreAllCaughtUp}
                </h2>
                <p className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest mb-8">
                  {t.checkBackLater}
                </p>
                <button
                  onClick={() => {
                    setLoading(true);
                    setCurrentIndex(0);
                    fetchJobs();
                  }}
                  className="w-full py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black font-mono text-xs uppercase tracking-widest hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-all"
                >
                  {t.refreshFeed}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {activeTab === 'matches' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
            <Heart className="w-16 h-16 text-gray-300 dark:text-white/20 mb-6" />
            <h2 className="font-display text-4xl uppercase tracking-tighter text-gray-900 dark:text-white mb-4">{t.matches}</h2>
            <p className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest">{t.yourSuccessfulConnections}</p>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="w-full h-full flex flex-col items-center justify-start text-center p-4">
            {/* Stories Row */}
            <div className="w-full flex gap-4 overflow-x-auto pb-4 mb-8 border-b border-gray-200 dark:border-white/10 hide-scrollbar">
              {stories.length > 0 ? stories.map((story, index) => (
                <div 
                  key={story.id} 
                  className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                  onClick={() => {
                    setSelectedStoryIndex(index);
                    setIsStoryViewerOpen(true);
                  }}
                >
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-orange-500 to-red-500">
                    <div className="w-full h-full rounded-full bg-white dark:bg-[#050505] border-2 border-white dark:border-[#050505] overflow-hidden">
                      <img src={story.company?.logo_url || `https://ui-avatars.com/api/?name=${story.company?.name || 'C'}`} alt="Company Story" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-gray-600 dark:text-white/70 uppercase tracking-widest truncate w-16">{story.company?.name}</span>
                </div>
              )) : (
                <div className="w-full text-center py-4">
                  <p className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest">No stories available</p>
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full flex flex-col">
              {matches.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 dark:text-white/20 mb-6" />
                  <h2 className="font-display text-4xl uppercase tracking-tighter text-gray-900 dark:text-white mb-4">{t.messages}</h2>
                  <p className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest">{t.chatWithMatches}</p>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-2">
                  <h3 className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2 text-left px-2">Your Matches</h3>
                  {[...matches].sort((a, b) => {
                    const msgA = latestMessages[a.id];
                    const msgB = latestMessages[b.id];
                    if (!msgA && !msgB) return 0;
                    if (!msgA) return 1;
                    if (!msgB) return -1;
                    return new Date(msgB.created_at).getTime() - new Date(msgA.created_at).getTime();
                  }).map((match) => (
                    <div 
                      key={match.id}
                      onClick={async () => {
                        try {
                          let matchId = null;
                          const { data: existingMatch } = await supabase.from('matches').select('id, employer_id').eq('application_id', match.id).single();
                          
                          if (existingMatch) {
                            matchId = existingMatch.id;
                          } else {
                            // Try to find the employer user for this company
                            const { data: employerUser } = await supabase.from('users').select('id').eq('company_id', match.jobs?.company_id).limit(1).single();
                            if (employerUser) {
                              const { data: newMatch, error: matchError } = await supabase.from('matches').insert({
                                job_id: match.job_id,
                                candidate_id: match.candidate_id,
                                employer_id: employerUser.id,
                                application_id: match.id
                              }).select().single();
                              if (!matchError) {
                                matchId = newMatch?.id;
                              }
                            }
                          }

                          // Mark as read locally
                          setUnreadCounts(prev => ({ ...prev, [match.id]: 0 }));

                          setChatUser({
                            id: match.jobs?.companies?.id || match.job_id,
                            name: match.jobs?.companies?.name || 'Company',
                            matchId: matchId
                          });
                        } catch (err) {
                          console.error('Error opening chat:', err);
                          alert('Failed to open chat. Please try again.');
                        }
                      }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer relative"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 font-display text-xl uppercase">
                        {(match.jobs?.companies?.name || 'C').charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-display text-xl uppercase tracking-tighter text-gray-900 dark:text-white leading-none mb-1">
                          {match.jobs?.companies?.name || 'Company'}
                        </h4>
                        <p className="font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest truncate">
                          {match.jobs?.title}
                        </p>
                      </div>
                      <div className="relative">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                        {unreadCounts[match.id] > 0 && (
                          <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white z-20 border-2 border-white dark:border-[#050505]">
                            {unreadCounts[match.id] > 9 ? '9+' : unreadCounts[match.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <CandidateProfile />
        )}
      </main>

      <LiquidTabBar tabs={candidateTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <AnimatePresence>
        {isStoryViewerOpen && (
          <StoryViewer 
            stories={stories} 
            initialIndex={selectedStoryIndex} 
            onClose={() => setIsStoryViewerOpen(false)} 
          />
        )}
        {chatUser && user && (
          <ChatInterface
            currentUser={{ id: user.id, name: user.user_metadata?.full_name || 'Candidate' }}
            otherUser={chatUser}
            onClose={() => setChatUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
