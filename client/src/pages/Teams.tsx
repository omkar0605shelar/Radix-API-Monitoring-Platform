import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMyTeams, createTeam as createTeamApi, inviteMember } from '../services/teamService';
import { setTeams, addTeam } from '../redux/slices/teamSlice';
import Navbar from '../components/Navbar';
import { Users, UserPlus, Shield, Mail, Plus, Loader2, ArrowRight, Globe, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RootState } from '../redux/store';

const Teams = () => {
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const dispatch = useDispatch();
  const { teams } = useSelector((state: RootState) => state.team);

  const fetchTeams = async () => {
    try {
      const res = await getMyTeams();
      dispatch(setTeams(res));
      if (res.length > 0 && !selectedTeamId) {
        setSelectedTeamId(res[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch teams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    setCreating(true);
    try {
      const res = await createTeamApi(newTeamName);
      dispatch(addTeam(res));
      setNewTeamName('');
      setSelectedTeamId(res.id);
    } catch (err) {
      alert('Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !selectedTeamId) return;
    setInviting(true);
    try {
      await inviteMember(selectedTeamId, inviteEmail);
      setInviteEmail('');
      alert('Invitation sent successfully!');
    } catch (err) {
      alert('Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-6 py-10 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 italic uppercase">Collective Units</h1>
            <p className="text-slate-500 text-lg">Manage your development squads and platform accessibility.</p>
          </div>

          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleCreateTeam}
            className="flex items-center gap-3 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-64">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="New Team Identity"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-bold text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center transition-all disabled:opacity-50 shadow-xl shadow-slate-200 active:scale-95"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Initialize
            </button>
          </motion.form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Teams List */}
          <div className="lg:col-span-8 space-y-8">
            {loading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((_, i) => <div key={i} className="h-32 bg-white/50 animate-pulse rounded-[2rem] border border-slate-100" />)}
              </div>
            ) : teams.length === 0 ? (
              <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white flex flex-col items-center gap-6">
                <div className="p-8 bg-slate-50 rounded-full">
                  <Users className="h-16 w-16 text-slate-200" />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-xl font-black text-slate-900 italic uppercase">Zero Units Detected</h3>
                  <p className="text-slate-500 font-medium mt-2 leading-relaxed">Create your first development cell to start collaborating on infrastructure intelligence.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {teams.map((team, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={team.id}
                    className={`p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-primary/30 transition-all group relative cursor-pointer shadow-premium hover:shadow-2xl ${selectedTeamId === team.id ? 'ring-4 ring-primary/5 border-primary' : ''}`}
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-2xl text-slate-900 group-hover:text-primary transition-colors">{team.name}</h3>
                          {selectedTeamId === team.id && (
                            <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-primary/10">Active Context</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                          <Globe className="h-3 w-3" /> Created {new Date(team.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex -space-x-3 group/members">
                        {team.members.map((member: any) => (
                          <div
                            key={member.user_id}
                            className="h-12 w-12 rounded-xl bg-slate-100 border-4 border-white flex items-center justify-center text-xs font-black shadow-lg hover:-translate-y-2 transition-transform cursor-default"
                            title={member.user?.name}
                          >
                            {member.user?.name?.[0].toUpperCase()}
                          </div>
                        ))}
                        <div className="h-12 w-12 rounded-xl bg-primary text-white border-4 border-white flex items-center justify-center text-xs font-black shadow-lg">
                          +0
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          <Users className="h-3.5 w-3.5" />
                          {team.members.length} Squad Members
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Authorized Pipeline
                        </div>
                      </div>
                      <ArrowRight className={`h-5 w-5 text-slate-200 group-hover:text-primary transition-all ${selectedTeamId === team.id ? 'translate-x-2 text-primary' : ''}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Invitation Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <AnimatePresence mode="wait">
              {selectedTeamId ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <UserPlus className="h-32 w-32" />
                  </div>
                  <h3 className="font-black text-2xl mb-2 flex items-center gap-3">
                    <UserPlus className="h-6 w-6 text-primary" /> Recruit Expert
                  </h3>
                  <p className="text-sm text-slate-400 font-bold mb-10 uppercase tracking-widest">Expansion Protocol</p>

                  <form onSubmit={handleInvite} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Communication Channel</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="expert@infrastructure.com"
                          className="w-full pl-12 pr-4 py-4 border border-white/10 rounded-[1.5rem] bg-white/5 focus:ring-4 focus:ring-primary/20 outline-none font-bold text-sm transition-all"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={inviting}
                      className="w-full bg-white text-slate-900 py-4 rounded-[1.5rem] font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl hover:bg-slate-100 active:scale-95 disabled:opacity-30"
                    >
                      {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Dispatch Invitation
                    </button>
                  </form>
                </motion.div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center space-y-4 opacity-60">
                  <Users className="h-12 w-12 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Team for Operations</p>
                </div>
              )}
            </AnimatePresence>

            <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                <Shield className="h-24 w-24" />
              </div>
              <h4 className="font-black flex items-center gap-2 mb-8 text-xs uppercase tracking-[0.25em] text-slate-900 italic">
                <Shield className="h-4 w-4 text-primary" /> Authority Hierarchy
              </h4>
              <div className="space-y-6">
                {[
                  { r: 'ADMIN', c: 'text-primary bg-primary/5', d: 'Global synchronization of settings, members and units.' },
                  { r: 'EXPERT', c: 'text-blue-500 bg-blue-50', d: 'Read/Write access to pipelines and diagnostic consoles.' },
                  { r: 'OBSERVER', c: 'text-slate-400 bg-slate-50', d: 'Read-only access to intelligence documentation.' }
                ].map(role => (
                  <div key={role.r} className="space-y-2">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black italic tracking-widest ${role.c}`}>{role.r}</span>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{role.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Teams;
