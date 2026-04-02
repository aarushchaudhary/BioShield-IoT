import { useState, useEffect } from 'react';
import api, { loginAsSecurityOfficer } from '../lib/api';
import { ApiSettings } from '../components/ApiSettings';
import { 
  Fingerprint, Trash2, ShieldCheck, Binary, Smartphone, 
  RefreshCw, Activity, AlertCircle, Terminal, Siren, 
  Cpu, XOctagon, AlertTriangle, Database, Server, Settings, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Constant ID for the hackathon demo
const DEVICE_ID = "emulator-5554";

export const Dashboard = () => {
  // Demo State
  const [demoUserId, setDemoUserId] = useState<string | null>(null);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [status, setStatus] = useState<'idle' | 'triggering_enroll' | 'waiting_enroll' | 'triggering_verify' | 'waiting_verify' | 'enrolled'>('idle');
  const [proof, setProof] = useState<{ raw: number[], hash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Metrics State
  const [stats, setStats] = useState<any>(null);
  const [threshold, setThreshold] = useState<number>(0.35);
  const [breachData, setBreachData] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Authentication & Initial Data Load
  useEffect(() => {
    const initializeDashboard = async () => {
      // Authenticate as security officer
      const authenticated = await loginAsSecurityOfficer();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        fetchStats();
      } else {
        setError('Failed to authenticate with API. Check the API connection settings.');
      }
    };

    initializeDashboard();
    
    // Auto-refresh stats every 5 seconds
    const interval = setInterval(() => {
      if (isAuthenticated) fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch a valid existing User UUID from the seeded DB so the emulator doesn't crash on foreign key errors
      const dumpRes = await api.get('/stats/simulate-breach');
      const firstUserId = dumpRes.data?.users_table?.[0]?.id;
      if (firstUserId) setDemoUserId(firstUserId);

      const res = await api.get('/stats');
      setStats(res.data);
      setError(null);

      if (firstUserId) {
        try {
          const vizRes = await api.get(`/stats/visualize/${firstUserId}`);
          setProof({ raw: vizRes.data.original_minutiae, hash: vizRes.data.template_biohash });
          setHasTemplate(true);
          setStatus('enrolled');
        } catch (e) {
          // Normal if not enrolled
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      setError(`Failed to load dashboard: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
      // Set offline status if not already set
      if (!stats) {
        setStats({ db_status: 'offline', redis_status: 'offline' });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // SECTION A: DEMO CONTROL HUB
  // ---------------------------------------------------------------------------
  const handleTriggerEnrollment = async () => {
    if (!demoUserId) {
      setError("No valid test user loaded from DB.");
      return;
    }
    setError(null);
    setStatus('triggering_enroll');
    try {
      await api.post('/device/trigger-enrollment', {
        user_id: demoUserId,
        device_id: DEVICE_ID
      });
      setStatus('waiting_enroll');
    } catch (e: any) {
      setError('Failed to trigger device: ' + (e.response?.data?.detail || e.message));
      setStatus('idle');
    }
  };

  const handleSimulateEnrollment = async () => {
    if (!demoUserId) {
      setError("No valid test user loaded from DB.");
      return;
    }
    setError(null);
    setStatus('triggering_enroll');
    try {
      // Call simulate endpoint - it returns the data directly (NO SECOND FETCH!)
      const response = await api.post(`/stats/simulate-enrollment/${demoUserId}`);
      // Use the returned data immediately
      setProof({ raw: response.data.original_minutiae, hash: response.data.template_biohash });
      setHasTemplate(true);
      setStatus('enrolled');
      setSimulating(false);
      fetchStats();
    } catch (e: any) {
      setError('Failed to simulate enrollment: ' + (e.response?.data?.detail || e.message));
      setStatus('idle');
      setSimulating(false);
    }
  };

  const handleTriggerVerification = async () => {
    if (!hasTemplate) return;
    setError(null);
    setVerifyResult(null);
    setStatus('triggering_verify');
    try {
      await api.post('/device/trigger-enrollment', { // Trigger scanner on device again for verification
        user_id: demoUserId,
        device_id: DEVICE_ID,
        is_verification: true
      });
      setStatus('waiting_verify');
    } catch (e: any) {
      setError('Failed to trigger verification: ' + (e.response?.data?.detail || e.message));
      setStatus('enrolled');
    }
  };

  const handleSimulateVerification = async () => {
    if (!hasTemplate) return;
    setError(null);
    setVerifyResult(null);
    setStatus('triggering_verify');
    try {
      const response = await api.post(`/stats/simulate-verify/${demoUserId}`);
      setVerifyResult(response.data.passed);
      setStatus('enrolled');
      fetchStats();
    } catch (e: any) {
      setError('Failed to simulate verification: ' + (e.response?.data?.detail || e.message));
      setStatus('enrolled');
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Warning: This immediately and irrevocably revokes your active biometric template!")) return;
    try {
      await api.post('/biometric/cancel', { user_id: demoUserId });
      setHasTemplate(false);
      setProof(null);
      setVerifyResult(null);
      setStatus('idle');
      fetchStats();
    } catch (e: any) {
      alert("Revocation failed: " + e.message);
    }
  };

  // Poll for enrollment/verification completion
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'waiting_enroll' || status === 'waiting_verify') {
      interval = setInterval(async () => {
        try {
          if (status === 'waiting_enroll') {
            const { data } = await api.get(`/stats/visualize/${demoUserId}`);
            setProof({ raw: data.original_minutiae, hash: data.template_biohash });
            setHasTemplate(true);
            setStatus('enrolled');
            fetchStats();
            clearInterval(interval);
          } else if (status === 'waiting_verify') {
             // In a real app we'd poll an audit or match status endpoint. 
             // We'll simulate a fetch of latest audit logs to check if a recent auth happened
             const { data } = await api.get('/audit?limit=1');
             if (data.items && data.items.length > 0) {
               const latest = data.items[0];
               // Simple heuristic: if the log happened within the last 10 seconds
               const logTime = new Date(latest.created_at).getTime();
               if (Date.now() - logTime < 10000 && latest.action === 'authentication') {
                 setVerifyResult(latest.success);
                 setStatus('enrolled');
                 fetchStats();
                 clearInterval(interval);
               }
             }
          }
        } catch (err: any) {
          // Keep polling
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, demoUserId]);


  // ---------------------------------------------------------------------------
  // SECTION C: ATTACK SIMULATION
  // ---------------------------------------------------------------------------
  const handleSimulateBreach = async () => {
    setSimulating(true);
    setBreachData(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const { data } = await api.get('/stats/simulate-breach');
      setBreachData(data);
    } catch (e) {
      alert("Error simulating breach");
    } finally {
      setSimulating(false);
    }
  };

  // Derived FAR/FRR metrics based on slider (simulated adjustment for demo)
  const simulatedFAR = stats ? Math.max(0, (stats.far || 0.0) - (threshold - 0.35) * 5) : 0;
  const simulatedFRR = stats ? Math.max(0, (stats.frr || 0.0) + (threshold - 0.35) * 10) : 0;

  return (
    <div className="min-h-screen bg-[#030712] text-white p-8 font-sans selection:bg-cyan-900 selection:text-cyan-100">
      
      {/* Top Navigation / Title */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.5)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              BIOSHIELD <span className="text-cyan-500">IOT</span>
            </h1>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <StatusBadge icon={<Database className="w-4 h-4" />} label="PGSQL" status={stats?.db_status} />
          <StatusBadge icon={<Server className="w-4 h-4" />} label="REDIS" status={stats?.redis_status} />
          <StatusBadge icon={<Activity className="w-4 h-4" />} label="EDGE" status="online" />
          <button 
            onClick={fetchStats}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Refresh stats"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <ApiSettings onUrlChange={fetchStats} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1800px] mx-auto">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: DEMO CONTROL & METRICS                         */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-8 flex flex-col">
          
          {/* SECTION A: THE DEMO CONTROL HUB */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/10 rounded-full blur-[80px] pointer-events-none" />
            
            <SectionTitle icon={<Smartphone />} title="Demo Control Hub" />
            
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Command the Android emulator remotely. Biometric scans executed on the edge device securely transmit non-invertible templates to this server.
            </p>

            {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

            <div className="space-y-4 relative z-10">
              {!hasTemplate ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleTriggerEnrollment} disabled={status !== 'idle'}
                      className="py-4 bg-gradient-to-r from-cyan-600/90 to-blue-700/90 border border-cyan-500/50 hover:border-cyan-400 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(8,145,178,0.2)] hover:shadow-[0_0_30px_rgba(8,145,178,0.4)] disabled:opacity-50">
                      {(status === 'triggering_enroll' || status === 'waiting_enroll') ? <Activity className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
                      <span>{status === 'triggering_enroll' ? 'Pinging...' : status === 'waiting_enroll' ? 'Scanning...' : 'Device'}</span>
                    </button>
                    <button onClick={handleSimulateEnrollment} disabled={status !== 'idle'}
                      className="py-4 bg-gradient-to-r from-purple-600/90 to-pink-700/90 border border-purple-500/50 hover:border-purple-400 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-50 text-sm">
                      <Fingerprint className="w-5 h-5" />
                      <span>Simulate</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">Click Device to trigger physical scanner or Simulate for mock enrollment</p>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleTriggerVerification} disabled={status !== 'enrolled'}
                      className="py-4 bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50 hover:border-emerald-500/50 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 text-sm">
                      {(status === 'triggering_verify' || status === 'waiting_verify') ? <Activity className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      <span>{status === 'triggering_verify' ? 'Pinging...' : status === 'waiting_verify' ? 'Scanning...' : 'Device'}</span>
                    </button>
                    <button onClick={handleSimulateVerification} disabled={status !== 'enrolled'}
                      className="py-4 bg-violet-900/30 text-violet-400 border border-violet-500/30 hover:bg-violet-900/50 hover:border-violet-500/50 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] disabled:opacity-50 text-sm">
                      {status === 'triggering_verify' || status === 'waiting_verify' ? <Activity className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      <span>Simulate</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">Device: use physical scanner | Simulate: instant verification</p>
                  
                  {verifyResult !== null && (
                    <div className={`p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold border ${verifyResult ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50' : 'bg-rose-900/20 text-rose-400 border-rose-900/50'}`}>
                      {verifyResult ? 'Authentication Success!' : 'Authentication Rejected!'}
                    </div>
                  )}

                  <button onClick={handleRevoke}
                    className="w-full py-4 bg-rose-900/20 text-rose-500 border border-rose-900/40 hover:bg-rose-900/30 hover:border-rose-500/50 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                    <Trash2 className="w-5 h-5" />
                    Revoke Biometric Template
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SECTION C - Part 1: Security Metrics */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl flex-grow flex flex-col relative overflow-hidden">
             <SectionTitle icon={<Activity />} title="System Strictness & Metrics" />
             
             <div className="mb-6 bg-gray-950/50 p-4 rounded-xl border border-gray-800">
               <div className="flex justify-between items-center mb-2">
                 <label className="text-sm font-mono text-gray-400 flex items-center gap-2"><Settings className="w-4 h-4" /> Match Threshold</label>
                 <span className="text-cyan-400 font-mono font-bold text-lg">{threshold.toFixed(2)}</span>
               </div>
               <input 
                 type="range" min="0.10" max="0.70" step="0.01" 
                 value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))}
                 className="w-full accent-cyan-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
               />
               <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2">
                 <span>Lenient (Higher FAR)</span>
                 <span>Strict (Higher FRR)</span>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-6">
                <MetricCard icon={<AlertTriangle className="text-orange-400" />} title="FRR" value={`${simulatedFRR.toFixed(2)}%`} color="orange" />
                <MetricCard icon={<XOctagon className="text-red-400" />} title="FAR" value={`${simulatedFAR.toFixed(2)}%`} color="red" />
             </div>
             
             <div className="flex-grow min-h-[150px] relative z-10 bg-gray-950/50 rounded-xl border border-gray-800/50 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Match Avg', score: stats?.average_match_score || 0, threshold: threshold }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b7280" domain={[0, 1]} tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid #1f2937' }} cursor={{fill: '#111827'}} />
                  <Bar dataKey="score" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>


        {/* ========================================================= */}
        {/* RIGHT COLUMN: VISUALISATION & ATTACK SIMULATION           */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-8 flex flex-col">
          
          {/* SECTION B: THE TEMPLATE VISUALISATION ENGINE */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden min-h-[450px] flex flex-col">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            <SectionTitle icon={<Binary className="text-cyan-400" />} title="Template Visualisation Engine" subtitle="Live Cache" />

            {!proof ? (
               <div className="flex-grow flex flex-col items-center justify-center text-gray-500 space-y-4">
                 <Fingerprint className="w-20 h-20 opacity-20" />
                 <p className="font-mono text-sm uppercase tracking-widest">Waitng for Emulator Input...</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 flex-grow relative z-10">
                 
                 {/* Raw Minutiae */}
                 <div className="group flex flex-col">
                    <div className="flex justify-between items-center mb-3 pr-2">
                       <h3 className="font-mono text-sm text-gray-300 font-semibold uppercase tracking-widest">Raw Minutiae Map</h3>
                       <span className="text-[10px] text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-900/30 font-mono tracking-widest">CRITICAL</span>
                    </div>
                    <div className="flex-grow grid grid-cols-8 gap-2 p-6 bg-[#0a0f18] rounded-2xl border border-gray-800 transition-transform duration-500 group-hover:border-gray-700 w-full items-center justify-center shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                       {proof.raw.map((val, i) => {
                         const intensity = Math.floor(((val + 1) / 2) * 255);
                         return (
                           <div key={i} className="aspect-square w-full rounded-[2px] shadow-sm transform transition-all duration-300 group-hover:shadow-[0_0_8px_currentColor] group-hover:scale-110"
                                style={{ backgroundColor: `rgb(${intensity}, ${intensity/2}, 255)`,
                                         color: `rgba(${intensity}, ${intensity/2}, 255, 0.5)` }} />
                         );
                       })}
                    </div>
                 </div>

                 {/* Cancellable BioHash */}
                 <div className="group flex flex-col">
                    <div className="flex justify-between items-center mb-3 pr-2">
                       <h3 className="font-mono text-sm text-gray-300 font-semibold uppercase tracking-widest">Cancellable Template</h3>
                       <span className="text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/30 font-mono tracking-widest">SECURE</span>
                    </div>
                    <div className="flex-grow grid grid-cols-8 gap-2 p-6 bg-[#0a0f18] rounded-2xl border border-cyan-900/30 transition-transform duration-500 group-hover:border-cyan-700/50 shadow-[inset_0_4px_30px_rgba(8,145,178,0.1)]">
                       {proof.hash.split('').map((val, i) => (
                         <div key={i} className={`aspect-square w-full rounded-[2px] flex items-center justify-center font-mono text-xs transform transition-all duration-300 ${
                             val === '1' ? 'bg-cyan-500 text-cyan-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-gray-800 text-gray-600 border border-gray-700'
                           }`}>
                           {val}
                         </div>
                       ))}
                    </div>
                 </div>

               </div>
            )}
          </div>

          {/* SECTION C - Part 2: Attack Simulation View */}
          <div className="bg-[#0b0c10] border-l-4 border-rose-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-rose-700 transition-colors">
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <Siren className="w-6 h-6 text-rose-500 animate-pulse" />
                <h3 className="text-xl font-black uppercase text-rose-500 tracking-widest">DB Exfiltration Sandbox</h3>
              </div>
              <button onClick={handleSimulateBreach} disabled={simulating}
                className="px-4 py-2 bg-rose-950/40 border border-rose-800 text-rose-400 hover:bg-rose-900 hover:text-white rounded font-mono text-xs uppercase transition-all shadow-sm shadow-rose-900/50 disabled:opacity-50">
                {simulating ? 'Running...' : 'Execute Dump'}
              </button>
            </div>
            
            <div className={`transition-all duration-500 bg-black/80 rounded-xl border border-rose-900/30 overflow-hidden font-mono text-xs ${breachData ? 'min-h-[200px]' : 'h-10'}`}>
              <div className="bg-gray-900/90 border-b border-rose-900/30 p-2 text-gray-500 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-500" /> <span className="text-rose-400/80">root@db:~#</span> {simulating ? <span className="animate-pulse">pg_dump --data-only bioshield_db...</span> : (breachData ? 'cat /tmp/breach.json' : 'idle')}
              </div>
              {breachData && (
                <div className="p-4 max-h-[250px] overflow-y-auto text-emerald-500 scrollbar-thin scrollbar-thumb-gray-800">
                  <span className="text-gray-500 mb-2 block font-bold">
                    {"/*"} EXFILTRATION COMPLETE. PARSING HASHES... {"*/"}<br/>
                    {"/*"} ERROR: INVERTIBILITY THEOREM VIOLATED. DECRYPTION IMPOSSIBLE. {"*/"}
                  </span>
                  <pre className="whitespace-pre-wrap text-[10px] text-emerald-400/80">
                    {JSON.stringify(breachData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800/60">
    <div className="p-2 bg-gray-800 text-cyan-400 rounded-lg">{icon}</div>
    <div>
      <h2 className="text-xl font-bold tracking-tight text-gray-100">{title}</h2>
      {subtitle && <p className="text-xs text-cyan-500/80 font-mono tracking-widest uppercase mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const StatusBadge = ({ icon, label, status }: { icon: React.ReactNode, label: string, status?: string }) => (
  <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-800 px-4 py-2 rounded-xl backdrop-blur-sm">
    <div className="text-gray-500">{icon}</div>
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{label}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-rose-500'}`} />
        <span className={`text-[10px] font-mono uppercase ${status === 'online' ? 'text-emerald-400' : 'text-rose-500'}`}>{status || 'OFFLINE'}</span>
      </div>
    </div>
  </div>
);

const MetricCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: 'orange' | 'red' }) => (
  <div className={`bg-gray-900/60 p-5 rounded-2xl border ${color === 'orange' ? 'border-orange-900/30' : 'border-red-900/30'} flex flex-col gap-4 relative overflow-hidden group transition-all hover:bg-gray-900/80`}>
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[30px] transition-all duration-700 group-hover:scale-150 ${color === 'orange' ? 'bg-orange-900/10' : 'bg-red-900/10'}`} />
    
    <div className="flex items-center gap-3 relative z-10">
      <div className={`p-2.5 rounded-xl bg-${color}-900/30 border border-${color}-900/50 shadow-inner text-${color}-400`}>
        {icon}
      </div>
      <div className="font-mono text-xs tracking-widest text-gray-400 uppercase">{title}</div>
    </div>
    
    <div className={`font-black text-3xl tracking-tighter relative z-10 ${color === 'orange' ? 'text-orange-400' : 'text-red-400'}`}>
      {value}
    </div>
  </div>
);
