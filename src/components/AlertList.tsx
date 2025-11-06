import { AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react';
import { DetectionAlert } from '../lib/dosDetection';

interface AlertListProps {
  alerts: DetectionAlert[];
  onMitigate: (alertId: string, action: string) => void;
  onMarkFalsePositive: (alertId: string) => void;
}

export function AlertList({ alerts, onMitigate, onMarkFalsePositive }: AlertListProps) {
  const severityConfig = {
    low: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Shield },
    medium: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
    high: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle },
    critical: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  };

  const statusConfig = {
    active: { color: 'text-red-600 bg-red-50', label: 'Active' },
    mitigated: { color: 'text-green-600 bg-green-50', label: 'Mitigated' },
    false_positive: { color: 'text-gray-600 bg-gray-50', label: 'False Positive' },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Detection Alerts</h3>
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          {alerts.filter((a) => a.status === 'active').length} Active
        </span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No alerts detected</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const statusInfo = statusConfig[alert.status];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${config.color} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{alert.alert_type}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm opacity-90 mb-2">
                        Source: <span className="font-mono font-medium">{alert.source_ip}</span>
                        {' → '}
                        Target: <span className="font-mono font-medium">{alert.target}</span>
                      </p>
                      <div className="flex gap-4 text-xs opacity-80">
                        <span>Packets: {alert.packet_count}</span>
                        <span>Rate: {alert.avg_request_rate.toFixed(1)} req/s</span>
                        <span>
                          {new Date(alert.detection_time).toLocaleTimeString()}
                        </span>
                      </div>
                      {alert.mitigation_action && (
                        <p className="text-xs mt-2 opacity-80">
                          Action: {alert.mitigation_action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {alert.status === 'active' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-current opacity-30">
                    <button
                      onClick={() => onMitigate(alert.id!, 'IP blocked and traffic filtered')}
                      className="px-3 py-1.5 bg-white text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      Block IP
                    </button>
                    <button
                      onClick={() => onMitigate(alert.id!, 'Rate limiting applied')}
                      className="px-3 py-1.5 bg-white text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      Rate Limit
                    </button>
                    <button
                      onClick={() => onMarkFalsePositive(alert.id!)}
                      className="px-3 py-1.5 bg-white text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors ml-auto"
                    >
                      False Positive
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
