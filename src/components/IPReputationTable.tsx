import { Shield, AlertCircle, Ban } from 'lucide-react';
import { IPReputation } from '../lib/dosDetection';

interface IPReputationTableProps {
  reputations: IPReputation[];
}

export function IPReputationTable({ reputations }: IPReputationTableProps) {
  const sortedReputations = [...reputations].sort((a, b) => a.reputation_score - b.reputation_score);

  const getReputationColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getReputationLabel = (score: number) => {
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Suspicious';
    return 'Malicious';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">IP Reputation Monitor</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">IP Address</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Requests</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Suspicious</th>
            </tr>
          </thead>
          <tbody>
            {sortedReputations.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No IP data available</p>
                </td>
              </tr>
            ) : (
              sortedReputations.map((rep) => (
                <tr key={rep.ip_address} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm font-medium text-gray-900">{rep.ip_address}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className={`h-2 rounded-full ${
                            rep.reputation_score >= 70
                              ? 'bg-green-500'
                              : rep.reputation_score >= 40
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${rep.reputation_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-[3ch]">
                        {rep.reputation_score.toFixed(0)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {rep.is_blocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium">
                        <Ban className="w-3 h-3" />
                        Blocked
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getReputationColor(
                          rep.reputation_score
                        )}`}
                      >
                        {rep.reputation_score >= 70 ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {getReputationLabel(rep.reputation_score)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{rep.total_requests}</td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-red-600">{rep.suspicious_requests}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({rep.total_requests > 0 ? ((rep.suspicious_requests / rep.total_requests) * 100).toFixed(0) : 0}%)
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
