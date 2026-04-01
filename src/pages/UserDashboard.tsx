import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Fingerprint, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';

export const UserDashboard = () => {
  const [hasTemplate, setHasTemplate] = useState(false);
  const [lastResult, setLastResult] = useState<{ score: number, success: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const { data } = await api.get('/biometric/status');
    setHasTemplate(data.has_template);
  };

  const generateMockMinutiae = () => Array.from({ length: 128 }, () => Math.random() * 2 - 1);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      await api.post('/biometric/enroll', { minutiae: generateMockMinutiae() });
      setHasTemplate(true);
      alert("Enrolled Successfully!");
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/biometric/verify', { minutiae: generateMockMinutiae() });
      setLastResult({ score: data.match_score, success: data.match_score < 0.35 });
    } finally { setLoading(false); }
  };

  const handleRevoke = async () => {
    if (!confirm("Are you sure? This cancels your biometric identity!")) return;
    await api.post('/biometric/cancel');
    setHasTemplate(false);
    setLastResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl text-center">
        <div className="inline-block p-4 rounded-full bg-gray-900 border border-cyan-900/50 mb-6">
          <Fingerprint className={`w-16 h-16 ${hasTemplate ? 'text-cyan-400' : 'text-gray-600'}`} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Biometric Identity</h2>
        <p className="text-gray-400 mb-8">
          {hasTemplate ? "Your BioHash is active and stored in the decentralized vault." : "No biometric template found. Please enroll to access secure systems."}
        </p>

        {!hasTemplate ? (
          <button onClick={handleEnroll} disabled={loading} className="w-full py-4 bg-cyan-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-500 transition-all disabled:opacity-50">
            <Fingerprint size={20} /> Start Biometric Enrollment
          </button>
        ) : (
          <div className="space-y-4">
            <button onClick={handleVerify} disabled={loading} className="w-full py-4 bg-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-600 transition-all">
              <ShieldCheck size={20} /> Simulate Hardware Verification
            </button>
            <button onClick={handleRevoke} className="w-full py-4 bg-red-900/20 text-red-500 border border-red-900/50 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-900/40 transition-all">
              <Trash2 size={20} /> Revoke Biometric ID
            </button>
          </div>
        )}
      </div>

      {lastResult && (
        <div className={`p-8 rounded-2xl border flex flex-col items-center animate-in fade-in zoom-in duration-300 ${lastResult.success ? 'bg-green-900/10 border-green-800' : 'bg-red-900/10 border-red-800'}`}>
          {lastResult.success ? <ShieldCheck className="text-green-500 w-12 h-12 mb-4" /> : <ShieldAlert className="text-red-500 w-12 h-12 mb-4" />}
          <div className="text-3xl font-black mb-1">{lastResult.success ? 'ACCESS GRANTED' : 'ACCESS DENIED'}</div>
          <div className="font-mono text-sm opacity-60">Match Score: {lastResult.score.toFixed(4)} (Threshold &lt; 0.35)</div>
        </div>
      )}
    </div>
  );
};
