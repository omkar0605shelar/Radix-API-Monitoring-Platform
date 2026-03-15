import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { setProjects, addProject, Project } from '../redux/slices/projectSlice';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Search, Plus, FolderGit2, Activity, Github, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
    const interval = setInterval(fetchProjects, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;
    
    setImporting(true);
    try {
      const res = await api.post('/projects/import', { repositoryUrl: repoUrl });
      dispatch(addProject(res.data));
      setRepoUrl('');
    } catch (error) {
      console.error('Import failed', error);
      alert('Failed to import repository');
    } finally {
      setImporting(false);
    }
  };

  const chartData = projects.slice(0, 5).map(p => ({
    name: p.repository_url.split('/').pop() || 'Repo',
    endpoints: Math.floor(Math.random() * 20) + 5, // Mock data since API doesn't return count directly yet
  }));

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Manage your imported repositories and API documentation.</p>
          </div>
          <form onSubmit={handleImport} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="w-full pl-9 pr-4 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={importing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {importing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Import
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-semibold flex items-center"><FolderGit2 className="mr-2 h-5 w-5" /> Your Projects</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search projects..." className="pl-9 pr-4 py-1.5 text-sm border border-input rounded-md bg-background" />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-border rounded-xl bg-card">
                <FolderGit2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">Import a GitHub repository to automatically generate API documentation.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project: Project) => (
                  <Link 
                    to={`/projects/${project.id}`} 
                    key={project.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors hover:shadow-sm"
                  >
                    <div>
                      <h3 className="font-semibold text-lg text-primary">{project.repository_url.replace('https://github.com/', '')}</h3>
                      <p className="text-sm text-muted-foreground">Imported {new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center space-x-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                        project.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse'
                      }`}>
                        {project.status.toUpperCase()}
                      </span>
                      <div className="text-sm font-medium hover:underline text-foreground">View Docs &rarr;</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold flex items-center mb-6"><Activity className="mr-2 h-5 w-5" /> API Analytics</h3>
              <div className="h-64">
                {projects.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="endpoints" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No data available to display
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
