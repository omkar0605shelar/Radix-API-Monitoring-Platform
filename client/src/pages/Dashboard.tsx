import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { setProjects, addProject } from '../redux/slices/projectSlice';
import type { Project } from '../redux/slices/projectSlice';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Search, Plus, FolderGit2, Activity, Github, RefreshCw, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);

  const dispatch = useDispatch();
  const { projects } = useSelector((state: RootState) => state.project);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      dispatch(setProjects(res.data));
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setImporting(true);
    setImportError(null);
    try {
      const res = await api.post('/projects/import', { repositoryUrl: repoUrl });
      dispatch(addProject(res.data));
      setRepoUrl('');
    } catch (error: any) {
      console.error('Import failed', error);
      const msg = error.response?.data?.message || (error.response?.status === 401 ? 'Session expired or unauthorized. Please re-login.' : 'Failed to import repository.');
      setImportError(msg);
    } finally {
      setImporting(false);
    }
  };

  const chartData = projects.slice(0, 5).map(p => ({
    name: p.repository_url?.split('/').pop() || 'Repo',
    endpoints: Math.floor(Math.random() * 20) + 5,
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-6 py-10 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Intelligence Dashboard</h1>
            <p className="text-slate-500 text-lg">Monitor, analyze, and optimize your API infrastructure.</p>
          </div>
          <form onSubmit={handleImport} className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
              <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  if (importError) setImportError(null);
                }}
                placeholder="Paste GitHub repository URL"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={importing}
              className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-3 rounded-xl font-semibold flex items-center transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
            >
              {importing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Import Project
            </button>
          </form>
        </div>

        {importError && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-between gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
              <span>{importError}</span>
            </div>
            <Link
              to="/login"
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors shrink-0"
            >
              Re-login
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-800 flex items-center"><FolderGit2 className="mr-2 h-5 w-5 text-primary" /> Active Projects</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Filter projects..." className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 backdrop-blur-sm">
                <FolderGit2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800">No project intelligence yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">Connect your first GitHub repository to start receiving AI-powered RADIX insights.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project: Project) => (
                  <Link
                    to={`/projects/${project.id}`}
                    key={project.id}
                    className="group relative flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-primary transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 transition-colors">
                        <Github className="h-6 w-6 text-slate-600 group-hover:text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">{project.repository_url?.replace('https://github.com/', '')}</h3>
                        <p className="text-sm font-medium text-slate-400">Created {new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase border ${project.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          project.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                        }`}>
                        {project.status}
                      </span>
                      <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-premium overflow-hidden relative">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl" />
              <h3 className="font-bold text-slate-900 flex items-center mb-8"><Activity className="mr-2 h-5 w-5 text-primary" /> Global Performance</h3>
              <div className="h-64">
                {projects.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                      <YAxis fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="endpoints" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm italic font-medium">
                    Waiting for project data...
                  </div>
                )}
              </div>
              <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Logs</p>
                  <p className="text-2xl font-black text-slate-900">12.4K</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Health</p>
                  <p className="text-2xl font-black text-emerald-600">99.8%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
