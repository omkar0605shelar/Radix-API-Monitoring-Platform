import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { setEndpoints, setSelectedEndpoint } from '../redux/slices/endpointSlice';
import type { Endpoint } from '../redux/slices/endpointSlice';
import api from '../services/api';
import Navbar from '../components/Navbar';
import TestingConsole from '../components/TestingConsole';
import AIExplanation from '../components/AIExplanation';
import AIAudit from '../components/AIAudit';
import AIRefactor from '../components/AIRefactor';
import AITestCases from '../components/AITestCases';
import { Search, Code as CodeIcon, Server, Database, ArrowLeft, Terminal, LayoutDashboard, Settings, Info, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dispatch = useDispatch();
  const { endpoints, selectedEndpoint } = useSelector((state: RootState) => state.endpoint);

  const fetchEndpoints = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.get(`/endpoints/project/${id}`);
      dispatch(setEndpoints(res.data));
      if (res.data && res.data.length > 0 && !selectedEndpoint) {
        dispatch(setSelectedEndpoint(res.data[0]));
      }
    } catch (error: any) {
      console.error('Failed to fetch endpoints', error);
      setErrorMessage(error.response?.data?.message || 'Failed to load endpoints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEndpoints();
  }, [id, dispatch]);

  const methodStyles = (method: string, active: boolean) => {
    const methods: Record<string, string> = {
      'GET': active ? 'bg-blue-600 text-white' : 'text-blue-600 bg-blue-50 border-blue-100',
      'POST': active ? 'bg-emerald-600 text-white' : 'text-emerald-600 bg-emerald-50 border-emerald-100',
      'PUT': active ? 'bg-amber-600 text-white' : 'text-amber-600 bg-amber-50 border-amber-100',
      'DELETE': active ? 'bg-rose-600 text-white' : 'text-rose-600 bg-rose-50 border-rose-100',
      'PATCH': active ? 'bg-violet-600 text-white' : 'text-violet-600 bg-violet-50 border-violet-100',
    };
    return methods[method.toUpperCase()] || (active ? 'bg-slate-600 text-white' : 'text-slate-600 bg-slate-50 border-slate-100');
  };

  const filteredEndpoints = endpoints.filter(ep => 
    ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ep.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-4rem)]">
          <div className="p-6 space-y-6 border-b border-slate-100">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors group">
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              Back to Workspace
            </Link>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search endpoints..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : errorMessage ? (
              <div className="py-12 px-4 text-center space-y-3">
                <p className="text-xs font-bold text-rose-500">{errorMessage}</p>
                <button
                  onClick={fetchEndpoints}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            ) : filteredEndpoints.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <Search className="h-10 w-10 text-slate-200 mx-auto" />
                <p className="text-sm font-bold text-slate-400">No endpoints found in this repository</p>
              </div>
            ) : (
              filteredEndpoints.map((ep: Endpoint) => (
                <button
                  key={ep.id}
                  onClick={() => dispatch(setSelectedEndpoint(ep))}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all group ${
                    selectedEndpoint?.id === ep.id 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-[1.02]' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border tracking-tighter transition-colors ${
                    methodStyles(ep.method, selectedEndpoint?.id === ep.id)
                  }`}>
                    {ep.method}
                  </span>
                  <span className="truncate flex-1 font-bold text-sm tracking-tight">{ep.path}</span>
                  <ChevronRight className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${selectedEndpoint?.id === ep.id ? 'text-slate-400' : 'text-slate-300'}`} />
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {selectedEndpoint ? (
              <motion.div 
                key={selectedEndpoint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-10 max-w-6xl mx-auto space-y-10 pb-32"
              >
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`p-5 rounded-2xl border ${methodStyles(selectedEndpoint.method, false)} shadow-sm`}>
                      <CodeIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-black tracking-tight text-slate-900 font-mono">{selectedEndpoint.path}</h1>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        <span className="text-primary">{selectedEndpoint.method}</span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span>Interactive Intelligence</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="p-3 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm text-slate-400 hover:text-slate-900">
                      <Settings className="h-5 w-5" />
                    </button>
                    <button className="p-3 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm text-slate-400 hover:text-slate-900">
                      <LayoutDashboard className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* AI Explanation Integrated */}
                <AIExplanation 
                  endpointId={selectedEndpoint.id} 
                  initialExplanation={selectedEndpoint.ai_explanation} 
                />

                {/* AI Security Auditor Integrated */}
                <AIAudit endpointId={selectedEndpoint.id} />

                {/* AI Refactoring Expert Integrated */}
                <AIRefactor endpointId={selectedEndpoint.id} />

                {/* AI QA Test Generator Integrated */}
                <AITestCases endpointId={selectedEndpoint.id} />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  {/* Left Column: Schemas */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <Database className="w-5 h-5 text-primary" /> Request Payload
                        </h3>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-tighter">Application/JSON</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 relative shadow-premium group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <CodeIcon className="h-4 w-4 text-slate-300" />
                        </div>
                        {selectedEndpoint.request_schema ? (
                          <pre className="text-xs font-mono text-slate-700 overflow-x-auto leading-relaxed scrollbar-hide">
                            {JSON.stringify(selectedEndpoint.request_schema, null, 2)}
                          </pre>
                        ) : (
                          <div className="flex items-center gap-3 text-sm font-bold text-slate-400 py-4 italic">
                            <Info className="h-5 w-5" /> No request payload required.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <Server className="w-5 h-5 text-emerald-500" /> Response Template
                        </h3>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-tighter">200 OK</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 relative shadow-premium group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <CodeIcon className="h-4 w-4 text-slate-300" />
                        </div>
                        {selectedEndpoint.response_schema ? (
                          <pre className="text-xs font-mono text-slate-800 overflow-x-auto leading-relaxed scrollbar-hide">
                            {JSON.stringify(selectedEndpoint.response_schema, null, 2)}
                          </pre>
                        ) : (
                          <div className="flex items-center gap-3 text-sm font-bold text-slate-400 py-4 italic">
                             No response schema detected.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Testing Console */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                      <Terminal className="w-6 h-6 text-primary" /> Technical Console
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-premium overflow-hidden">
                       <TestingConsole endpoint={selectedEndpoint} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                   <div className="relative p-12 bg-white rounded-full border border-slate-100 shadow-premium">
                      <CodeIcon className="w-20 h-20 text-slate-200" />
                   </div>
                </div>
                <div className="text-center max-w-sm space-y-3">
                  <h2 className="text-2xl font-black text-slate-900">Select an Endpoint</h2>
                  <p className="text-slate-500 font-medium leading-relaxed">Choose an intelligence node from the sidebar to explore technical schemas and run automated tests.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetails;
