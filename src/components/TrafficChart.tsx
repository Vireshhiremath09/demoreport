import { TrafficLog } from '../lib/dosDetection';

interface TrafficChartProps {
  logs: TrafficLog[];
}

export function TrafficChart({ logs }: TrafficChartProps) {
  const maxRate = Math.max(...logs.map((log) => log.request_rate), 100);
  const recentLogs = logs.slice(0, 30).reverse();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Rate Monitor</h3>
      <div className="flex items-end justify-between h-48 gap-1">
        {recentLogs.map((log, index) => {
          const height = (log.request_rate / maxRate) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col justify-end">
              <div
                className={`rounded-t transition-all ${
                  log.is_suspicious ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${log.source_ip}: ${log.request_rate} req/s (Score: ${log.threat_score.toFixed(2)})`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 text-xs text-gray-500">
        <span>30s ago</span>
        <span>Now</span>
      </div>
      <div className="flex gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-gray-600">Normal Traffic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-gray-600">Suspicious Traffic</span>
        </div>
      </div>
    </div>
  );
}
