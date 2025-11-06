import { Shield, Activity, Play, Pause } from 'lucide-react';
import { useDoSDetection } from './hooks/useDoSDetection';
import { StatCard } from './components/StatCard';
import { TrafficChart } from './components/TrafficChart';
import { AlertList } from './components/AlertList';
import { IPReputationTable } from './components/IPReputationTable';
import { TrafficLogStream } from './components/TrafficLogStream';

function App() {
  const {
    trafficLogs,
    alerts,
    ipReputations,
    stats,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    mitigateAlert,
    markFalsePositive,
  } = useDoSDetection();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DoS Detection System</h1>
                <p className="text-sm text-gray-600">Machine Learning-Based Network Security Monitor</p>
              </div>
            </div>
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                isMonitoring
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-5 h-5" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Monitoring
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Requests"
            value={stats.totalRequests}
            icon={Activity}
            color="blue"
          />
          <StatCard
            title="Suspicious Traffic"
            value={stats.suspiciousRequests}
            icon={Shield}
            color="red"
            trend={stats.suspiciousRequests > 0 ? 'up' : 'neutral'}
          />
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={Shield}
            color="yellow"
          />
          <StatCard
            title="Blocked IPs"
            value={stats.blockedIPs}
            icon={Shield}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TrafficChart logs={trafficLogs} />
          <AlertList
            alerts={alerts}
            onMitigate={mitigateAlert}
            onMarkFalsePositive={markFalsePositive}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TrafficLogStream logs={trafficLogs} />
          <IPReputationTable reputations={ipReputations} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Detection Capabilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">High-Rate Flooding</h4>
                <p className="text-xs text-gray-600">Detects volumetric attacks with high request rates</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Low-Rate DoS</h4>
                <p className="text-xs text-gray-600">Identifies stealthy low-and-slow attacks</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Port Scanning</h4>
                <p className="text-xs text-gray-600">Detects suspicious port targeting behavior</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Burst Detection</h4>
                <p className="text-xs text-gray-600">Identifies sudden traffic spikes and patterns</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">IP Reputation</h4>
                <p className="text-xs text-gray-600">Tracks and scores IP address behavior over time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Real-Time Analysis</h4>
                <p className="text-xs text-gray-600">ML-based threat scoring in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
