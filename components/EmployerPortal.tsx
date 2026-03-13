'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { translations } from '@/lib/translations';
import LiquidTabBar from './LiquidTabBar';
import EmployerProfile from './EmployerProfile';
import JobForm from './JobForm';
import CompanyStoryForm from './CompanyStoryForm';
import ChatInterface from './ChatInterface';
import { Loader2, LogOut, Plus, Briefcase, Users, CheckCircle2, XCircle, LayoutDashboard, MessageSquare, User as UserIcon, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function EmployerPortal() {
  const { user, language, logout } = useStore();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [chatUser, setChatUser] = useState<any | null>(null);
  const [latestMessages, setLatestMessages] = useState<Record<string, any>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const employerTabs = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'candidates', label: t.candidates, icon: Users },
    { id: 'postings', label: t.postings, icon: Briefcase },
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
      // Fetch all matches for this employer
      const { data: matches } = await supabase
        .from('matches')
        .select('id, application_id')
        .eq('employer_id', user.id);

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
      .channel('employer_messages')
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

  const fetchEmployerData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (userData?.company_id) {
        if (activeTab === 'postings' || activeTab === 'dashboard') {
          const { data } = await supabase
            .from('jobs')
            .select('*')
            .eq('company_id', userData.company_id);
          setJobs(data || []);
        }
        
        if (activeTab === 'candidates' || activeTab === 'dashboard') {
          // Fetch candidates who applied to this company's jobs
          const { data: companyJobs } = await supabase
            .from('jobs')
            .select('id, title')
            .eq('company_id', userData.company_id);

          if (companyJobs && companyJobs.length > 0) {
            const jobIds = companyJobs.map(j => j.id);
            
            // Fetch applications first
            const { data: basicApps, error: basicError } = await supabase
              .from('applications')
              .select('*')
              .in('job_id', jobIds);

            if (basicError) {
              console.error('Error fetching applications:', basicError?.message || JSON.stringify(basicError));
            } else if (basicApps && basicApps.length > 0) {
              // Fetch candidates
              const candidateIds = [...new Set(basicApps.map(app => app.candidate_id))];
              const { data: candidatesData } = await supabase
                .from('users')
                .select('id, email, full_name, avatar_url, headline, location, bio')
                .in('id', candidateIds);
                
              const candidatesMap = (candidatesData || []).reduce((acc: any, user: any) => {
                acc[user.id] = user;
                return acc;
              }, {});

              // Fetch jobs
              const { data: jobsData } = await supabase
                .from('jobs')
                .select('id, title')
                .in('id', jobIds);
                
              const jobsMap = (jobsData || []).reduce((acc: any, job: any) => {
                acc[job.id] = job;
                return acc;
              }, {});

              const candidatesWithMocks = basicApps.filter(app => app.status !== 'rejected').map(app => {
                const hash = app.job_id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) + 
                             app.candidate_id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const hasQuests = (app.job_id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 2) === 0;
                
                return {
                  ...app,
                  users: candidatesMap[app.candidate_id] || null,
                  jobs: jobsMap[app.job_id] || null,
                  questScore: app.quest_score || (hasQuests ? (hash % 50) + 50 : null),
                  vibeScore: app.vibe_score || ((hash % 40) + 60)
                };
              });
              
              setCandidates(candidatesWithMocks);
            } else {
              setCandidates([]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching employer data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    fetchEmployerData();
  }, [fetchEmployerData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  const handleOpenJobForm = (job: any = null) => {
    setEditingJob(job);
    setIsJobFormOpen(true);
  };

  const handleCloseJobForm = () => {
    setIsJobFormOpen(false);
    setEditingJob(null);
  };

  const handleJobSuccess = () => {
    handleCloseJobForm();
    fetchEmployerData(); // Refresh jobs list
  };

  const handleOpenStoryForm = () => {
    setIsStoryFormOpen(true);
  };

  const handleCloseStoryForm = () => {
    setIsStoryFormOpen(false);
  };

  const handleStorySuccess = () => {
    handleCloseStoryForm();
    // Refresh stories list or show success message
  };

  const pendingCandidates = candidates.filter(c => c.status === 'pending' || !c.status);
  const matchedCandidates = candidates
    .filter(c => c.status === 'accepted')
    .sort((a, b) => {
      const msgA = latestMessages[a.id];
      const msgB = latestMessages[b.id];
      if (!msgA && !msgB) return 0;
      if (!msgA) return 1;
      if (!msgB) return -1;
      return new Date(msgB.created_at).getTime() - new Date(msgA.created_at).getTime();
    });

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-6 md:p-12 flex flex-col bg-gray-50 dark:bg-[#050505] pb-32 transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center justify-between mb-12 pb-6 border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-tighter text-gray-900 dark:text-white">{t.employerPortal}</h1>
          <p className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest mt-2">{t.manageJobsAndCandidates}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white transition-colors font-mono text-xs uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t.signOut}</span>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="space-y-8">
            <h2 className="font-display text-3xl uppercase tracking-tighter text-gray-900 dark:text-white">{t.overview}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-orange-500/10 border border-orange-500/30">
                    <Briefcase className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest">{t.activeJobs}</h3>
                </div>
                <p className="font-display text-5xl text-gray-900 dark:text-white">{jobs.length}</p>
              </div>
              <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-blue-500/10 border border-blue-500/30">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest">{t.totalCandidates}</h3>
                </div>
                <p className="font-display text-5xl text-gray-900 dark:text-white">{pendingCandidates.length}</p>
              </div>
              <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-green-500/10 border border-green-500/30">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest">{t.matches}</h3>
                </div>
                <p className="font-display text-5xl text-gray-900 dark:text-white">{matchedCandidates.length}</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'postings' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-3xl uppercase tracking-tighter text-gray-900 dark:text-white">{t.yourPostings}</h2>
              <button 
                onClick={() => handleOpenJobForm()}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors font-mono text-xs uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" />
                {t.postJob}
              </button>
            </div>
            
            {jobs.length === 0 ? (
              <div className="text-center py-20 border border-gray-200 dark:border-white/10 rounded-3xl bg-white dark:bg-white/5">
                <Briefcase className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-6" />
                <p className="font-mono text-sm text-gray-500 dark:text-white/50 uppercase tracking-widest">{t.noActiveJobs}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <h3 className="font-display text-2xl uppercase tracking-tighter text-gray-900 dark:text-white mb-1">{job.title}</h3>
                      <p className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest">{job.location} • {job.salary_range}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenJobForm(job)}
                        className="px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 font-mono text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        {t.editJob}
                      </button>
                      <button 
                        onClick={() => handleOpenStoryForm()}
                        className="px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 font-mono text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        {t.addStory}
                      </button>
                      <span className="px-4 py-2 rounded-full border border-green-500/30 text-green-600 dark:text-green-400 font-mono text-xs uppercase tracking-widest bg-green-500/10">
                        Active
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'candidates' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-3xl uppercase tracking-tighter text-gray-900 dark:text-white">{t.pendingCandidates}</h2>
            </div>

            {pendingCandidates.length === 0 ? (
              <div className="text-center py-20 border border-gray-200 dark:border-white/10 rounded-3xl bg-white dark:bg-white/5">
                <Users className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-6" />
                <p className="font-mono text-sm text-gray-500 dark:text-white/50 uppercase tracking-widest">{t.noCandidates}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingCandidates.map((candidate) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer"
                    onClick={() => {
                      setSelectedCandidate(candidate);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-2xl uppercase tracking-tighter text-gray-900 dark:text-white">
                          {candidate.users?.full_name || 'Anonymous Candidate'}
                        </h3>
                        <span className="px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 font-mono text-[10px] uppercase tracking-widest">
                          Applied for: {candidate.jobs?.title}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-gray-500 dark:text-white/50">{candidate.users?.email}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Vibe Score */}
                      <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 min-w-[100px]">
                        <span className="font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest mb-1">{t.vibeMatch}</span>
                        <span className="font-display text-2xl text-orange-500 dark:text-orange-400">{candidate.vibeScore}%</span>
                      </div>

                      {/* Quest Score */}
                      <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 min-w-[100px]">
                        <span className="font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest mb-1">{t.questScore}</span>
                        {candidate.questScore !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-display text-2xl text-gray-900 dark:text-white">{candidate.questScore}%</span>
                            {candidate.questScore >= 50 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-gray-400 dark:text-white/30">N/A</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const { error: updateError } = await supabase.from('applications').update({ status: 'rejected' }).eq('id', candidate.id);
                              if (updateError) throw updateError;
                              setCandidates(candidates.filter(c => c.id !== candidate.id));
                            } catch (e) {
                              console.error('Error rejecting candidate', e);
                            }
                          }}
                          className="px-6 py-3 rounded-full border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-mono text-xs uppercase tracking-widest"
                        >
                          {t.pass}
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const { error: updateError } = await supabase.from('applications').update({ status: 'accepted' }).eq('id', candidate.id);
                              if (updateError) throw updateError;
                              
                              setCandidates(candidates.map(c => c.id === candidate.id ? { ...c, status: 'accepted' } : c));
                              alert('Connected with candidate!');
                            } catch (e) {
                              console.error('Error connecting with candidate', e);
                              alert('Failed to connect. Please try again.');
                            }
                          }}
                          className="px-6 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
                        >
                          {t.connect}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'messages' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-3xl uppercase tracking-tighter text-gray-900 dark:text-white">{t.messages}</h2>
            </div>

            {matchedCandidates.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 py-32 bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-white/20 mb-6" />
                <h2 className="font-display text-4xl uppercase tracking-tighter text-gray-900 dark:text-white mb-4">{t.messages}</h2>
                <p className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest">{t.chatWithMatches}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {matchedCandidates.map((candidate) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer"
                    onClick={() => {
                      setSelectedCandidate(candidate);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-2xl uppercase tracking-tighter text-gray-900 dark:text-white">
                          {candidate.users?.full_name || 'Anonymous Candidate'}
                        </h3>
                        <span className="px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 font-mono text-[10px] uppercase tracking-widest">
                          Matched for: {candidate.jobs?.title}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-gray-500 dark:text-white/50">{candidate.users?.email}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Vibe Score */}
                      <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 min-w-[100px]">
                        <span className="font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest mb-1">{t.vibeMatch}</span>
                        <span className="font-display text-2xl text-orange-500 dark:text-orange-400">{candidate.vibeScore}%</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${candidate.users?.email}`;
                          }}
                          className="px-6 py-3 rounded-full border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-mono text-xs uppercase tracking-widest flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              let matchId = null;
                              const { data: existingMatch } = await supabase.from('matches').select('id').eq('application_id', candidate.id).single();
                              if (existingMatch) {
                                matchId = existingMatch.id;
                              } else {
                                const { data: newMatch, error: matchError } = await supabase.from('matches').insert({
                                  job_id: candidate.job_id,
                                  candidate_id: candidate.candidate_id,
                                  employer_id: user?.id,
                                  application_id: candidate.id
                                }).select().single();
                                if (matchError) throw matchError;
                                matchId = newMatch?.id;
                              }
                              
                              // Mark as read locally
                              setUnreadCounts(prev => ({ ...prev, [candidate.id]: 0 }));
                              
                              setChatUser({
                                id: candidate.users?.id || candidate.candidate_id,
                                name: candidate.users?.full_name || 'Anonymous Candidate',
                                matchId: matchId
                              });
                            } catch (err) {
                              console.error('Error opening chat:', err);
                              alert('Failed to open chat. Please try again.');
                            }
                          }}
                          className="relative px-6 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message
                          {unreadCounts[candidate.id] > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white z-20 border-2 border-white dark:border-[#050505]">
                              {unreadCounts[candidate.id] > 9 ? '9+' : unreadCounts[candidate.id]}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <EmployerProfile />
        )}
      </main>

      <LiquidTabBar tabs={employerTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <AnimatePresence>
        {isJobFormOpen && (
          <JobForm 
            job={editingJob} 
            onClose={handleCloseJobForm} 
            onSuccess={handleJobSuccess} 
          />
        )}
        {isStoryFormOpen && (
          <CompanyStoryForm 
            onClose={handleCloseStoryForm} 
            onSuccess={handleStorySuccess} 
          />
        )}
        {chatUser && user && (
          <ChatInterface
            currentUser={{ id: user.id, name: user.user_metadata?.full_name || 'Employer' }}
            otherUser={chatUser}
            onClose={() => setChatUser(null)}
          />
        )}
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  {selectedCandidate.users?.avatar_url ? (
                    <img src={selectedCandidate.users.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-gray-400 dark:text-white/30" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-display text-3xl uppercase tracking-tighter text-gray-900 dark:text-white">
                      {selectedCandidate.users?.full_name || 'Anonymous Candidate'}
                    </h2>
                    <p className="font-mono text-sm text-gray-500 dark:text-white/50">{selectedCandidate.users?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500 dark:text-white/50" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2">Applied For</h3>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedCandidate.jobs?.title}</p>
                </div>

                {selectedCandidate.users?.headline && (
                  <div>
                    <h3 className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2">Headline</h3>
                    <p className="text-gray-900 dark:text-white">{selectedCandidate.users.headline}</p>
                  </div>
                )}

                {selectedCandidate.users?.location && (
                  <div>
                    <h3 className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2">Location</h3>
                    <p className="text-gray-900 dark:text-white">{selectedCandidate.users.location}</p>
                  </div>
                )}

                {selectedCandidate.users?.bio && (
                  <div>
                    <h3 className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2">Bio</h3>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedCandidate.users.bio}</p>
                  </div>
                )}

                <div className="flex gap-6 pt-4 border-t border-gray-200 dark:border-white/10">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest mb-1">{t.vibeMatch}</span>
                    <span className="font-display text-3xl text-orange-500 dark:text-orange-400">{selectedCandidate.vibeScore}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest mb-1">{t.questScore}</span>
                    <span className="font-display text-3xl text-gray-900 dark:text-white">
                      {selectedCandidate.questScore !== null ? `${selectedCandidate.questScore}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
