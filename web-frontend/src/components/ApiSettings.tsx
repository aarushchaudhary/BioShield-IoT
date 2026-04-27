import { useState } from 'react';
import { Settings, Check, AlertCircle, Loader, X } from 'lucide-react';
import api, { getApiBaseUrl, setApiBaseUrl, loginAsSecurityOfficer } from '../lib/api';

interface ApiSettingsProps {
  onUrlChange?: () => void;
}

export const ApiSettings = ({ onUrlChange }: ApiSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'disconnected'>('idle');

  const handleTestConnection = async () => {
    setLoading(true);
    setConnectionStatus('idle');
    try {
      const response = await api.get('/health', {
        baseURL: apiUrl,
        timeout: 5000,
      });
      if (response.data?.status === 'ok') {
        setConnectionStatus('connected');
        setMessage({ type: 'success', text: '✓ Connected successfully!' });
      } else {
        setConnectionStatus('disconnected');
        setMessage({ type: 'error', text: '✗ Connection failed - invalid response' });
      }
    } catch (error: any) {
      setConnectionStatus('disconnected');
      const errorMsg = error.response?.data?.detail || error.message || 'Connection failed';
      setMessage({ type: 'error', text: `✗ ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    let url = apiUrl.trim();
    
    // Validate URL
    if (!url) {
      setMessage({ type: 'error', text: 'Please enter an API URL' });
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    if (!url.endsWith('/')) {
      url += '/';
    }
    
    setApiUrl(url);
    setApiBaseUrl(url);
    setConnectionStatus('idle');
    
    // Re-authenticate with the new API URL
    setLoading(true);
    const authenticated = await loginAsSecurityOfficer();
    setLoading(false);
    
    if (authenticated) {
      setMessage({ type: 'success', text: '✓ API URL saved and authenticated!' });
      // Trigger the onUrlChange callback to refresh stats
      if (onUrlChange) {
        setTimeout(() => {
          onUrlChange();
        }, 500);
      }
    } else {
      setMessage({ type: 'error', text: '✗ Failed to authenticate with new API URL' });
      return;
    }
    
    setTimeout(() => {
      setIsOpen(false);
      setMessage(null);
    }, 1500);
  };

  const handleReset = () => {
    const defaultUrl = 'https://172.31.32.154:8000/';
    setApiUrl(defaultUrl);
    setApiBaseUrl(defaultUrl);
    setConnectionStatus('idle');
    setMessage({ type: 'success', text: '✓ Reset to default' });
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        title="API Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0a0e27] border border-gray-700 rounded-xl p-6 w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                API Configuration
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current URL Display */}
            <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Current API URL:</p>
              <p className="text-sm font-mono text-cyan-400 break-all">{getApiBaseUrl()}</p>
            </div>

            {/* API URL Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Backend API URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="192.168.1.100:8000 or https://api.example.com"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Examples: 192.168.1.100:8000 or https://192.168.1.100:8000
              </p>
            </div>

            {/* Connection Status */}
            {connectionStatus !== 'idle' && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                connectionStatus === 'connected'
                  ? 'bg-green-900/30 border border-green-700'
                  : 'bg-red-900/30 border border-red-700'
              }`}>
                {connectionStatus === 'connected' ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-200">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm text-red-200">Disconnected</span>
                  </>
                )}
              </div>
            )}

            {/* Messages */}
            {message && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-green-900/30 border border-green-700 text-green-200'
                  : 'bg-red-900/30 border border-red-700 text-red-200'
              }`}>
                {message.type === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleTestConnection}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                Test Connection
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-colors"
              >
                Save
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-sm"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </>
  );
};
