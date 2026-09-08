import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Activity,
  Sparkles,
  Check,
  X,
  Play,
  Terminal,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { incidentService, type IncidentItem } from '../services/incidentService';

const IncidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackComments, setFeedbackComments] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchIncident = async () => {
    if (!id) return;
    try {
      const data = await incidentService.getIncidentById(id);
      setIncident(data);
      if (data.feedbacks && data.feedbacks.length > 0) {
        setFeedbackSubmitted(true);
      }
    } catch (err: any) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      timeout: 20000,
      reconnectionAttempts: 5
    });

    socket.on('incident.analyzing', (data: { incidentId: string }) => {
      if (data.incidentId === id) setAnalyzing(true);
    });

    socket.on('incident.analysis.completed', (data: { incidentId: string }) => {
      if (data.incidentId === id) {
        setAnalyzing(false);
        fetchIncident();
      }
    });

    socket.on('incident.remediation.started', () => fetchIncident());
    socket.on('incident.resolved', () => fetchIncident());
    socket.on('incident.escalated', () => fetchIncident());

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const handleApprove = async (actionId: string) => {
    setExecutingActionId(actionId);
    setToastMessage('Approving action and running safe remediation...');
    try {
      await incidentService.approveRemediation(actionId, 'Approved by on-call engineer via console');
      setToastMessage('Remediation action executing! Automated verification starting...');
      await fetchIncident();
    } catch (err: any) {
      setToastMessage(`Action failed: ${err.message}`);
    } finally {
      setExecutingActionId(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleReject = async (actionId: string) => {
    try {
      await incidentService.rejectRemediation(actionId, 'Rejected by reviewer');
      setToastMessage('Remediation action rejected.');
      await fetchIncident();
    } catch (err: any) {
      setToastMessage(`Rejection failed: ${err.message}`);
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleReAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      await incidentService.triggerAnalysis(id);
      await fetchIncident();
    } catch (err: any) {
      setToastMessage(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFeedback = async (isCorrect: boolean) => {
    if (!id) return;
    try {
      await incidentService.submitFeedback(id, {
        isCorrect,
        comments: feedbackComments || (isCorrect ? 'Accurate diagnosis' : 'Needs tuning')
      });
      setFeedbackSubmitted(true);
      setToastMessage('Thank you! Feedback recorded for model reinforcement.');
      await fetchIncident();
    } catch (err: any) {
      setToastMessage(`Feedback error: ${err.message}`);
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Loading incident telemetry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Incident Not Found</h2>
            <Link to="/incidents" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">
              ← Return to Incidents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const metrics = incident.metrics_snapshot;
  const analysis = incident.analyses && incident.analyses.length > 0 ? incident.analyses[0] : null;
  const remediations = incident.remediations || [];
  const events = incident.events || [];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar />

      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-top-4">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{toastMessage}</div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link to="/incidents" className="hover:text-slate-900 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Incidents
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-bold">{incident.id.slice(0, 8)}</span>
        </div>

        {/* Incident Header Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  incident.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-600 border border-rose-200' :
                  incident.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-600 border border-amber-200' :
                  'bg-blue-500/10 text-blue-600 border border-blue-200'
                }`}>
                  {incident.severity}
                </span>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  incident.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  incident.status === 'AWAITING_APPROVAL' ? 'bg-amber-50 text-amber-700 border border-amber-300' :
                  'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {incident.status.replace('_', ' ')}
                </span>

                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {incident.category}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {incident.title}
              </h1>

              {incident.endpoint && (
                <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold">
                    {incident.endpoint.method}
                  </span>
                  <span>{incident.endpoint.path}</span>
                  {incident.project && (
                    <span className="text-slate-400 font-sans">
                      • Project: <strong className="text-slate-700">{incident.project.name}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <BrainCircuit className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                {analyzing ? 'AI Re-evaluating...' : 'Re-run AI Diagnosis'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Left (Telemetry + AI + Remediation) & Right (Timeline) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Telemetry Deviation Comparison Card */}
            {metrics && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-rose-500" />
                    Telemetry Anomaly Snapshot
                  </h3>
                  <span className="text-xs text-slate-400">Sample window: {metrics.sampleWindowSeconds}s</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Latency card */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <p className="text-xs font-bold text-slate-500 uppercase">Response Latency</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-rose-600">{metrics.currentLatencyMs}ms</span>
                      <span className="text-xs font-bold text-rose-600">+{metrics.latencyDeviationPct}%</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Baseline: {metrics.baselineLatencyMs}ms</p>
                  </div>

                  {/* Error rate card */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <p className="text-xs font-bold text-slate-500 uppercase">5xx Server Errors</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-rose-600">{metrics.currentErrorRatePct}%</span>
                      <span className="text-xs font-bold text-rose-600">{metrics.fiveXxCount} failed</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Baseline: {metrics.baselineErrorRatePct}%</p>
                  </div>

                  {/* Timeout card */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                    <p className="text-xs font-bold text-slate-500 uppercase">Query Timeouts</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-amber-600">{metrics.timeoutCount}</span>
                      <span className="text-xs font-bold text-amber-600">of {metrics.totalRequests} reqs</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Socket deadline: 5000ms</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. AI Root Cause Analysis & Explainability Engine */}
            {analysis && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">AI Root Cause Analysis</h3>
                      <p className="text-xs text-slate-400">Powered by {analysis.model} ({analysis.provider})</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase">Confidence</span>
                    <p className="text-xl font-black text-purple-600">
                      {Math.round(analysis.confidence * 100)}%
                    </p>
                  </div>
                </div>

                {/* Root cause highlight */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 mb-5">
                  <p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">Diagnosed Root Cause</p>
                  <p className="text-base font-bold text-purple-950">{analysis.root_cause}</p>
                </div>

                {/* Engineering Reasoning */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Reasoning</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
                    {analysis.reasoning}
                  </p>
                </div>

                {/* Evidence Checklist */}
                {Array.isArray(analysis.evidence) && analysis.evidence.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diagnostic Evidence</h4>
                    <div className="space-y-2">
                      {analysis.evidence.map((ev: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Human-in-the-loop Model Feedback Widget */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Was this diagnosis accurate?</p>
                    <p className="text-[11px] text-slate-400">Your feedback continuously fine-tunes the diagnostic heuristic engine.</p>
                  </div>

                  {feedbackSubmitted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> Verified by SRE
                    </span>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Optional notes..."
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFeedback(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> Yes
                        </button>
                        <button
                          onClick={() => handleFeedback(false)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" /> No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Recommended Remediation Actions & Approval Workflow */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <h3 className="text-base font-bold text-slate-900">Remediation Action Plan</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  Allowlist Controlled Registry
                </span>
              </div>

              {remediations.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No remediation actions proposed yet.</p>
              ) : (
                <div className="space-y-4">
                  {remediations.map((action: any) => {
                    const isExecuting = executingActionId === action.id || action.status === 'EXECUTING';
                    const hasExecuted = action.executions && action.executions.length > 0;
                    const latestExecution = hasExecuted ? action.executions[0] : null;

                    return (
                      <div
                        key={action.id}
                        className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors bg-white shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                action.risk === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                                action.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {action.risk} RISK
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-500">
                                {action.action_type}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900">{action.title}</h4>
                            <p className="text-xs text-slate-600 mt-1">{action.description}</p>
                            <p className="text-xs text-slate-400 mt-0.5 italic">Rationale: {action.reason}</p>
                          </div>

                          {/* Approval / Action Execution Controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            {action.status === 'AWAITING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleApprove(action.id)}
                                  disabled={isExecuting}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <Play className="w-3 h-3 text-emerald-400" />
                                  {isExecuting ? 'Executing...' : 'Approve & Remediate'}
                                </button>
                                <button
                                  onClick={() => handleReject(action.id)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                                  title="Reject recommendation"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {action.status === 'COMPLETED' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3.5 h-3.5" /> Executed
                              </span>
                            )}

                            {action.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <X className="w-3.5 h-3.5" /> Rejected
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Execution Console Logs & Post-Remediation Verification Banner */}
                        {latestExecution && (
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                            {latestExecution.result?.logs && (
                              <div className="bg-slate-900 rounded-xl p-3 text-slate-100 text-xs font-mono space-y-1 overflow-x-auto">
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5 mb-1.5">
                                  <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Execution Console
                                </div>
                                {latestExecution.result.logs.map((log: string, lIdx: number) => (
                                  <div key={lIdx} className="text-slate-300">{log}</div>
                                ))}
                              </div>
                            )}

                            {latestExecution.verification_result && (
                              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-emerald-950 space-y-1">
                                  <p className="font-bold">Automated Post-Remediation Verification Succeeded</p>
                                  <p>{latestExecution.verification_result.message}</p>
                                  <div className="flex items-center gap-4 text-[11px] text-emerald-800 pt-1 font-semibold">
                                    <span>Latency: {latestExecution.verification_result.beforeMetrics.latency}ms → {latestExecution.verification_result.afterMetrics.latency}ms</span>
                                    <span>Errors: {latestExecution.verification_result.beforeMetrics.errorRate}% → {latestExecution.verification_result.afterMetrics.errorRate}%</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Incident Lifecycle Stepper & Timeline */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Incident Event Timeline</h3>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {events.map((ev: any) => {
                  let dotColor = 'bg-slate-400';
                  if (ev.event_type.includes('CREATED')) dotColor = 'bg-rose-500';
                  else if (ev.event_type.includes('AI')) dotColor = 'bg-purple-500';
                  else if (ev.event_type.includes('APPROVED')) dotColor = 'bg-amber-500';
                  else if (ev.event_type.includes('EXECUTED')) dotColor = 'bg-sky-500';
                  else if (ev.event_type.includes('RESOLVED')) dotColor = 'bg-emerald-500';

                  return (
                    <div key={ev.id} className="relative">
                      <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full ${dotColor} ring-4 ring-white`} />
                      <p className="text-xs font-bold text-slate-800">{ev.event_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{ev.message}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-semibold">
                        <span>{new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        <span>•</span>
                        <span className="uppercase">{ev.actor_id || 'SYSTEM'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IncidentDetails;
