import { useEffect, useState } from 'react';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ShieldCheck, Database, Server } from 'lucide-react';

export const SecurityDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);

  useEffect(() => {
    api.get('/stats').then(res => setStats(res.data));
    api.get('/audit?limit=20').then(res => setAudit(res.data));
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Activity />} title="Total Users" value={stats?.total_users || 0} />
        <StatCard icon={<ShieldCheck />} title="Active Templates" value={stats?.active_templates || 0} />
        <StatusCard icon={<Database />} title="Main DB" status={stats?.db_status} />
        <StatusCard icon={<Server />} title="Redis Cache" status={stats?.redis_status} />
      </div>

      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold mb-6">Biometric Match Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ name: 'Avg Score', score: stats?.average_match_score || 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none' }} />
              <Bar dataKey="score" fill="#22d3ee" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700 font-semibold">Immutable Audit Log</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900/50 text-gray-400 text-sm">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Match</th>
                <th className="p-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {audit.map((log, i) => (
                <tr key={i} className="hover:bg-gray-700/30">
                  <td className="p-4 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4">{log.email}</td>
                  <td className="p-4 uppercase text-xs">{log.action}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${log.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {log.success ? 'TRUE' : 'FALSE'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value }: any) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
    <div className="text-cyan-400 mb-2">{icon}</div>
    <div className="text-gray-400 text-sm">{title}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const StatusCard = ({ icon, title, status }: any) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
    <div className="text-cyan-400 mb-2">{icon}</div>
    <div className="text-gray-400 text-sm mb-1">{title}</div>
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <span className="uppercase text-xs font-bold">{status || 'OFFLINE'}</span>
    </div>
  </div>
);
