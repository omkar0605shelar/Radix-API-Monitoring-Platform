import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Shield, Key, User, Plus, Trash2, Check, AlertTriangle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiKeys, createApiKey, revokeApiKey } from '../services/apiKeyService';
import { createCheckoutSession, getSubscriptionStatus } from '../services/billingService';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'keys' | 'billing'>('keys');
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysData, subData] = await Promise.all([
        getApiKeys(),
        getSubscriptionStatus()
      ]);
      setKeys(keysData);
      setSubscription(subData);
    } catch (err) {
      console.error('Failed to fetch settings data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    try {
      await createApiKey(newKeyName);
      setNewKeyName('');
      const updatedKeys = await getApiKeys();
      setKeys(updatedKeys);
    } catch (err) {
      console.error('Failed to create API key', err);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    try {
      await revokeApiKey(id);
      setKeys(keys.filter(k => k.id !== id));
    } catch (err) {
      console.error('Failed to revoke key', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-6 py-10 max-w-5xl">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500 text-lg">Manage your account, API security, and subscriptions.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar Nav */}
          <aside className="w-full md:w-64 space-y-2">
            {[
              { id: 'profile', label: 'Profile Settings', icon: User },
              { id: 'keys', label: 'API Infrastructure', icon: Key },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-primary shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === 'keys' && (
                <motion.div
                  key="keys"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-premium relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <Shield className="h-32 w-32" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                       <div>
                          <h3 className="text-xl font-black text-slate-900">Secret API Keys</h3>
                          <p className="text-slate-500 text-sm font-medium">Use these keys to authenticate your requests to the RADIX platform.</p>
                       </div>
                       <form onSubmit={handleCreateKey} className="flex gap-2 w-full sm:w-auto">
                          <input 
                            type="text" 
                            placeholder="Key Name (e.g. Production)" 
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="flex-1 sm:w-48 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none"
                            required
                          />
                          <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2">
                             <Plus className="h-4 w-4" /> Create
                          </button>
                       </form>
                    </div>

                    <div className="space-y-4">
                       {loading ? (
                         [1,2].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)
                       ) : keys.length === 0 ? (
                         <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                            <Key className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                            <p className="font-bold text-slate-400">No active keys generated.</p>
                         </div>
                       ) : (
                         keys.map(key => (
                           <div key={key.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                              <div className="space-y-1 flex-1">
                                 <div className="flex items-center gap-2">
                                    <h4 className="font-black text-slate-900">{key.name}</h4>
                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-tighter">Active</span>
                                 </div>
                                 <div className="flex items-center gap-2 group/key">
                                    <code className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                                       {key.key.substring(0, 8)}••••••••••••••••
                                    </code>
                                    <button 
                                      onClick={() => copyToClipboard(key.key, key.id)}
                                      className="p-1 hover:text-primary transition-colors"
                                    >
                                      {copySuccess === key.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                                    </button>
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Created {new Date(key.created_at).toLocaleDateString()}</p>
                              </div>
                              <button 
                                onClick={() => handleRevokeKey(key.id)}
                                className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                 <Trash2 className="h-5 w-5" />
                              </button>
                           </div>
                         ))
                       )}
                    </div>

                    <div className="mt-8 p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                       <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                       <p className="text-sm text-amber-800 font-medium leading-relaxed">
                          Do not share your API keys in publicly accessible areas (GitHub, client-side code, etc.). Anyone with your key can access your platform data.
                       </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Billing tab removed for now */}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-white border border-slate-200 rounded-3xl p-8 shadow-premium"
                >
                   <div className="flex items-center gap-8 mb-10 pb-10 border-b border-slate-100">
                      <div className="h-24 w-24 rounded-[2rem] bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                         <User className="h-10 w-10 text-slate-400" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Platform Admin</h3>
                         <p className="text-slate-500 font-bold">Managing account since 2024</p>
                      </div>
                   </div>

                   <form className="space-y-6 max-w-md">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Identity</label>
                         <input type="text" defaultValue="Demo User" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Communication Channel</label>
                         <input type="email" defaultValue="demo@example.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none" />
                      </div>
                      <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm hover:shadow-xl transition-all">
                         Synchronize Identity
                      </button>
                   </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
