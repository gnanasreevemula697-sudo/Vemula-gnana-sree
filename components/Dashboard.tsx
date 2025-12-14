import React, { useState } from 'react';
import { User, ScanResult } from '../types';
import { Processor } from './Processor';
import { Button } from './Button';
import { LogOut, History, Plus, FileText, Trash2, User as UserIcon } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<'history' | 'new'>('history');
  const [history, setHistory] = useState<ScanResult[]>([]);

  const handleScanComplete = (result: ScanResult) => {
    setHistory(prev => [result, ...prev]);
    setView('history');
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteScan = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-bio-600 p-2 rounded-lg">
                <FileText className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                FingerTrace Bio
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 hidden sm:block">Hello, {user.name}</span>
              <Button variant="secondary" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'history' ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">Manage your biometric traces and reports.</p>
              </div>
              <Button onClick={() => setView('new')}>
                <Plus className="h-5 w-5 mr-2" />
                New Trace
              </Button>
            </div>

            {history.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-600 mb-4">
                  <History className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No traces yet</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                  Upload a hand or fingerprint image to generate your first biometric trace report.
                </p>
                <Button onClick={() => setView('new')}>Start New Trace</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((scan) => (
                  <div key={scan.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-bio-500/50 transition-colors group">
                    <div className="aspect-video bg-slate-950 relative overflow-hidden">
                       {/* Compare Slider Effect on Hover could go here, for now just show processed */}
                      <img 
                        src={scan.processedUrl} 
                        alt="Scan Result" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                         <div className="bg-black/60 backdrop-blur text-xs px-2 py-1 rounded text-white">
                            PDF Ready
                         </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          {scan.subjectName ? (
                             <>
                                <h4 className="font-semibold text-white truncate pr-2 flex items-center gap-1.5">
                                   <UserIcon size={14} className="text-bio-500" />
                                   {scan.subjectName}
                                </h4>
                                <p className="text-xs text-slate-500 truncate">{scan.fileName}</p>
                             </>
                          ) : (
                             <>
                                <h4 className="font-semibold text-white truncate pr-2">{scan.fileName}</h4>
                                <p className="text-xs text-slate-500">No subject name</p>
                             </>
                          )}
                          <p className="text-xs text-slate-500 mt-1">{formatDate(scan.timestamp)}</p>
                        </div>
                        <button 
                          onClick={() => deleteScan(scan.id)}
                          className="text-slate-600 hover:text-red-500 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-4 flex gap-2">
                         <a 
                            href={scan.processedUrl} 
                            download={`trace-${scan.id}.png`}
                            className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors"
                         >
                            Download IMG
                         </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-6 flex items-center gap-2">
                <button 
                  onClick={() => setView('history')} 
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Dashboard
                </button>
                <span className="text-slate-600">/</span>
                <span className="text-white font-medium">New Trace</span>
             </div>
            <Processor user={user} onComplete={handleScanComplete} onCancel={() => setView('history')} />
          </div>
        )}
      </main>
    </div>
  );
};