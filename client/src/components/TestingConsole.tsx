import { useState, useEffect } from 'react';
import { History, Send, Terminal, Loader2, Clock, ShieldCheck, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { executeApiRequest, getRequestHistory } from '../services/testingService';
import { useDispatch, useSelector } from 'react-redux';
import { setHistory } from '../redux/slices/endpointSlice';
import type { RootState } from '../redux/store';

interface TestingConsoleProps {
  endpoint: any;
}

const TestingConsole = ({ endpoint }: TestingConsoleProps) => {
  const { currentProject } = useSelector((state: RootState) => state.project);
  const isLiveProject = Boolean(currentProject?.repository_url && !currentProject.repository_url.includes('github.com'));

  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'response'>('body');
  const [requestBody, setRequestBody] = useState(JSON.stringify(endpoint.request_schema || {}, null, 2));
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [executing, setExecuting] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [targetMode, setTargetMode] = useState<'mock' | 'live'>(isLiveProject ? 'live' : 'mock');
  const [liveBaseUrl, setLiveBaseUrl] = useState(
    isLiveProject && currentProject?.repository_url ? currentProject.repository_url : 'http://localhost:8000'
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (isLiveProject && currentProject?.repository_url) {
      setTargetMode('live');
      setLiveBaseUrl(currentProject.repository_url);
    }
  }, [currentProject?.id, isLiveProject]);

  useEffect(() => {
    setRequestBody(JSON.stringify(endpoint.request_schema || {}, null, 2));
    loadHistory();
  }, [endpoint.id]);

  const loadHistory = async () => {
    try {
      const history = await getRequestHistory(endpoint.id);
      dispatch(setHistory({ endpointId: endpoint.id, history }));
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setActiveTab('response');
    
    const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
    const computedUrl = targetMode === 'live' && liveBaseUrl.trim()
      ? `${liveBaseUrl.trim().replace(/\/$/, '')}${endpoint.path}`
      : `${backendBase}/api/mock/${endpoint.project_id}${endpoint.path}`;

    try {
      const result = await executeApiRequest({
        endpointId: endpoint.id,
        method: endpoint.method,
        url: computedUrl,
        headers: JSON.parse(headers),
        body: endpoint.method !== 'GET' ? JSON.parse(requestBody) : undefined
      });
      setResponse(result);
      loadHistory();
    } catch (err: any) {
      setResponse({
        error: true,
        message: err.response?.data?.message || err.message,
        status: err.response?.status || 500
      });
    } finally {
      setExecuting(false);
    }
  };

  const statusStyles = (status: number) => {
    if (status < 300) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (status < 400) return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden flex flex-col h-[650px]">
      {/* Header / URL Bar & Mode Switcher */}
      <div className="p-6 border-b border-slate-100 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Target API:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTargetMode('mock')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  targetMode === 'mock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                RADIX Mock
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('live')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  targetMode === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Live / Localhost
              </button>
            </div>
          </div>

          {targetMode === 'live' && (
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={liveBaseUrl}
                onChange={(e) => setLiveBaseUrl(e.target.value)}
                placeholder="Base URL (e.g. http://localhost:8000 or https://api.mysite.com)"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none font-mono"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 group focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
            <Globe className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
               <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                 endpoint.method === 'GET' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                 endpoint.method === 'POST' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                 'text-amber-600 bg-amber-50 border-amber-100'
               }`}>
                 {endpoint.method}
               </span>
               <span className="text-xs font-mono font-bold text-slate-600 truncate">
                 {targetMode === 'live' && liveBaseUrl.trim()
                   ? `${liveBaseUrl.trim().replace(/\/$/, '')}${endpoint.path}`
                   : `mock://radix${endpoint.path}`}
               </span>
            </div>
          </div>
          <button
            onClick={handleExecute}
            disabled={executing}
            className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center transition-all disabled:opacity-50 shadow-lg shadow-slate-200 active:scale-95 shrink-0"
          >
            {executing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Execute
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
        {['body', 'headers', 'params', 'response'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabConsole"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        <div className="flex-1 p-8 overflow-auto font-mono text-sm">
          <AnimatePresence mode="wait">
            {activeTab === 'body' && (
              <motion.textarea
                key="body"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full h-full bg-transparent resize-none focus:outline-none text-slate-700 leading-relaxed scrollbar-hide"
                placeholder="{}"
              />
            )}
            {activeTab === 'headers' && (
              <motion.textarea
                key="headers"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full h-full bg-transparent resize-none focus:outline-none text-slate-700 leading-relaxed scrollbar-hide"
                placeholder="{}"
              />
            )}
            {activeTab === 'response' && (
              <motion.div
                key="response"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col"
              >
                {response ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 border-b border-slate-100 pb-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                        <span className={`text-sm font-black px-3 py-1 rounded-lg border ${statusStyles(response.status)}`}>
                          {response.status} {response.status < 300 ? 'OK' : 'Error'}
                        </span>
                      </div>
                      <div className="space-y-1 border-l border-slate-100 pl-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Latency
                        </p>
                        <span className="text-sm font-black text-slate-900">{response.duration}ms</span>
                      </div>
                    </div>
                    <pre className="text-xs text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100 overflow-auto max-h-[350px] leading-relaxed">
                      {JSON.stringify(response.response || response, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-20">
                    <Terminal className="h-16 w-16 opacity-30" />
                    <p className="font-bold text-sm text-slate-400">Ready for execution</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              <History className="h-3 w-3" />
              History: {response ? '1 Log' : '0 Logs'}
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-[0.15em]">
              <ShieldCheck className="h-3 w-3" />
              Secure Pipeline
           </div>
        </div>
      </div>
    </div>
  );
};

export default TestingConsole;
