import { Activity, AlertCircle } from 'lucide-react';
import { TrafficLog } from '../lib/dosDetection';

interface TrafficLogStreamProps {
  logs: TrafficLog[];
}

export function TrafficLogStream({ logs }: TrafficLogStreamProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Live Traffic Stream
        </h3>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No traffic logged yet</p>
          </div>
        ) : (
          logs.slice(0, 50).map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                log.is_suspicious
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {log.is_suspicious && (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-medium text-gray-900">{log.source_ip}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-mono text-gray-600">{log.destination_ip}:{log.port}</span>
                  <span className="text-xs text-gray-500">{log.protocol}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                  <span>{log.packet_size}B</span>
                  <span>{log.request_rate} req/s</span>
                  {log.is_suspicious && (
                    <span className="text-red-600 font-medium">
                      Threat: {(log.threat_score * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="ml-auto text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
