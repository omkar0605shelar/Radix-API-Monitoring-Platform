import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { setEndpoints, Endpoint, setSelectedEndpoint } from '../redux/slices/endpointSlice';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Search, ChevronRight, Activity, Code as CodeIcon, Server, Database } from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dispatch = useDispatch();
  const { endpoints, selectedEndpoint } = useSelector((state: RootState) => state.endpoint);

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const res = await api.get(`/endpoints/project/${id}`);
        dispatch(setEndpoints(res.data));
      } catch (error) {
        console.error('Failed to fetch endpoints', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEndpoints();
  }, [id, dispatch]);

  const methodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'POST': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'PUT': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      case 'DELETE': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'PATCH': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const filteredEndpoints = endpoints.filter(ep => 
    ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ep.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-border bg-card/50 flex flex-col h-[calc(100vh-4rem)]">
          <div className="p-4 border-b border-border">
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center mb-4 transition-colors">
              &larr; Back to Dashboard
            </Link>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search endpoints..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading endpoints...</div>
            ) : filteredEndpoints.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No endpoints found.</div>
            ) : (
              <ul className="space-y-1">
                {filteredEndpoints.map((ep: Endpoint) => (
                  <li key={ep.id}>
                    <button
                      onClick={() => dispatch(setSelectedEndpoint(ep))}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 text-sm transition-colors ${
                        selectedEndpoint?.id === ep.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm w-12 text-center ${methodColor(ep.method)}`}>
                        {ep.method}
                      </span>
                      <span className="truncate flex-1">{ep.path}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto bg-background">
          {selectedEndpoint ? (
            <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center space-x-4 border-b border-border pb-6">
                <span className={`text-sm font-bold px-3 py-1 rounded-md ${methodColor(selectedEndpoint.method)}`}>
                  {selectedEndpoint.method}
                </span>
                <h1 className="text-2xl font-semibold font-mono tracking-tight">{selectedEndpoint.path}</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Request Spec */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center border-b border-border pb-2">
                    <Database className="w-5 h-5 mr-2 text-muted-foreground" /> Request Parameters
                  </h3>
                  {selectedEndpoint.request_schema ? (
                    <div className="bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto text-sm text-[#d4d4d4] font-mono border border-border">
                      <pre>{JSON.stringify(selectedEndpoint.request_schema, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No request body required for this endpoint.</div>
                  )}
                </div>

                {/* Response Spec */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center border-b border-border pb-2">
                    <Server className="w-5 h-5 mr-2 text-muted-foreground" /> Example Response
                  </h3>
                  {selectedEndpoint.response_schema ? (
                    <div className="bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto text-sm text-[#ce9178] font-mono border border-border">
                      <pre>{JSON.stringify(selectedEndpoint.response_schema, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No response schema detected.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <CodeIcon className="w-16 h-16 mb-4 opacity-20" />
              <p>Select an endpoint from the sidebar to view documentation.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProjectDetails;
