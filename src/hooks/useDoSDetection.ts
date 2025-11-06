import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DoSDetectionEngine, generateMockTraffic, TrafficLog, DetectionAlert, IPReputation } from '../lib/dosDetection';

export function useDoSDetection() {
  const [trafficLogs, setTrafficLogs] = useState<TrafficLog[]>([]);
  const [alerts, setAlerts] = useState<DetectionAlert[]>([]);
  const [ipReputations, setIpReputations] = useState<Map<string, IPReputation>>(new Map());
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    suspiciousRequests: 0,
    activeAlerts: 0,
    blockedIPs: 0,
  });

  const detectionEngineRef = useRef(new DoSDetectionEngine());
  const monitoringIntervalRef = useRef<number | null>(null);

  const processTraffic = useCallback(async (mockTraffic: Omit<TrafficLog, 'is_suspicious' | 'threat_score'>) => {
    const engine = detectionEngineRef.current;
    const analyzedTraffic = engine.analyzeTraffic(mockTraffic);

    const { error: logError } = await supabase
      .from('traffic_logs')
      .insert([analyzedTraffic]);

    if (logError) {
      console.error('Error inserting traffic log:', logError);
      return;
    }

    setTrafficLogs((prev) => [analyzedTraffic, ...prev].slice(0, 100));

    if (analyzedTraffic.is_suspicious) {
      const alert = engine.detectAttackPattern(analyzedTraffic.source_ip);
      if (alert) {
        const { error: alertError } = await supabase
          .from('detection_alerts')
          .insert([alert]);

        if (!alertError) {
          setAlerts((prev) => [alert, ...prev].slice(0, 50));
        }
      }

      const reputation = engine.calculateIPReputation(analyzedTraffic.source_ip);
      setIpReputations((prev) => new Map(prev).set(reputation.ip_address, reputation));

      const { error: repError } = await supabase
        .from('ip_reputation')
        .upsert([{
          ...reputation,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'ip_address',
        });

      if (repError) {
        console.error('Error updating IP reputation:', repError);
      }
    }
  }, []);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    monitoringIntervalRef.current = window.setInterval(() => {
      const mockTraffic = generateMockTraffic();
      processTraffic(mockTraffic);
    }, 500);
  }, [isMonitoring, processTraffic]);

  const stopMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const mitigateAlert = useCallback(async (alertId: string, action: string) => {
    const { error } = await supabase
      .from('detection_alerts')
      .update({
        status: 'mitigated',
        mitigation_action: action,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (!error) {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: 'mitigated', mitigation_action: action }
            : alert
        )
      );
    }
  }, []);

  const markFalsePositive = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from('detection_alerts')
      .update({
        status: 'false_positive',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (!error) {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, status: 'false_positive' } : alert
        )
      );
    }
  }, []);

  const loadRecentData = useCallback(async () => {
    const { data: recentLogs } = await supabase
      .from('traffic_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (recentLogs) {
      setTrafficLogs(recentLogs);
    }

    const { data: recentAlerts } = await supabase
      .from('detection_alerts')
      .select('*')
      .order('detection_time', { ascending: false })
      .limit(20);

    if (recentAlerts) {
      setAlerts(recentAlerts);
    }

    const { data: reputations } = await supabase
      .from('ip_reputation')
      .select('*')
      .order('updated_at', { ascending: false });

    if (reputations) {
      const repMap = new Map<string, IPReputation>();
      reputations.forEach((rep) => repMap.set(rep.ip_address, rep));
      setIpReputations(repMap);
    }
  }, []);

  useEffect(() => {
    loadRecentData();

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [loadRecentData]);

  useEffect(() => {
    const suspiciousCount = trafficLogs.filter((log) => log.is_suspicious).length;
    const activeAlertsCount = alerts.filter((alert) => alert.status === 'active').length;
    const blockedIPsCount = Array.from(ipReputations.values()).filter((rep) => rep.is_blocked).length;

    setStats({
      totalRequests: trafficLogs.length,
      suspiciousRequests: suspiciousCount,
      activeAlerts: activeAlertsCount,
      blockedIPs: blockedIPsCount,
    });
  }, [trafficLogs, alerts, ipReputations]);

  return {
    trafficLogs,
    alerts,
    ipReputations: Array.from(ipReputations.values()),
    stats,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    mitigateAlert,
    markFalsePositive,
  };
}
