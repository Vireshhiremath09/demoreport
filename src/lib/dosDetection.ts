export interface TrafficLog {
  id?: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  port: number;
  protocol: string;
  packet_size: number;
  request_rate: number;
  is_suspicious: boolean;
  threat_score: number;
}

export interface DetectionAlert {
  id?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  target: string;
  detection_time: string;
  packet_count: number;
  avg_request_rate: number;
  status: 'active' | 'mitigated' | 'false_positive';
  mitigation_action?: string;
  notes?: string;
}

export interface IPReputation {
  ip_address: string;
  reputation_score: number;
  total_requests: number;
  suspicious_requests: number;
  is_blocked: boolean;
  block_reason?: string;
}

export class DoSDetectionEngine {
  private readonly RATE_THRESHOLD = 100;
  private readonly PACKET_SIZE_THRESHOLD = 1500;
  private readonly SUSPICIOUS_PORTS = [22, 23, 3389, 445, 135];
  private readonly BURST_WINDOW = 5000;

  private trafficHistory: Map<string, TrafficLog[]> = new Map();

  analyzeTraffic(log: Omit<TrafficLog, 'is_suspicious' | 'threat_score'>): TrafficLog {
    const features = this.extractFeatures(log);
    const threatScore = this.calculateThreatScore(features);
    const isSuspicious = threatScore > 0.6;

    this.updateTrafficHistory(log.source_ip, {
      ...log,
      is_suspicious: isSuspicious,
      threat_score: threatScore,
    } as TrafficLog);

    return {
      ...log,
      is_suspicious: isSuspicious,
      threat_score: threatScore,
    };
  }

  private extractFeatures(log: Omit<TrafficLog, 'is_suspicious' | 'threat_score'>) {
    const history = this.trafficHistory.get(log.source_ip) || [];
    const recentTraffic = history.filter(
      (h) => Date.now() - new Date(h.timestamp).getTime() < this.BURST_WINDOW
    );

    return {
      request_rate: log.request_rate,
      packet_size: log.packet_size,
      is_suspicious_port: this.SUSPICIOUS_PORTS.includes(log.port),
      burst_count: recentTraffic.length,
      avg_packet_size: recentTraffic.length > 0
        ? recentTraffic.reduce((sum, t) => sum + t.packet_size, 0) / recentTraffic.length
        : log.packet_size,
      request_variance: this.calculateVariance(recentTraffic.map((t) => t.request_rate)),
    };
  }

  private calculateThreatScore(features: {
    request_rate: number;
    packet_size: number;
    is_suspicious_port: boolean;
    burst_count: number;
    avg_packet_size: number;
    request_variance: number;
  }): number {
    let score = 0;

    if (features.request_rate > this.RATE_THRESHOLD) {
      score += 0.3;
    }

    if (features.packet_size > this.PACKET_SIZE_THRESHOLD) {
      score += 0.15;
    } else if (features.packet_size < 100) {
      score += 0.2;
    }

    if (features.is_suspicious_port) {
      score += 0.15;
    }

    if (features.burst_count > 50) {
      score += 0.25;
    }

    if (features.request_variance > 1000) {
      score += 0.1;
    }

    if (features.avg_packet_size < 200 && features.request_rate > 50) {
      score += 0.15;
    }

    return Math.min(score, 1);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  private updateTrafficHistory(sourceIp: string, log: TrafficLog) {
    const history = this.trafficHistory.get(sourceIp) || [];
    history.push(log);

    const cutoffTime = Date.now() - 60000;
    const filtered = history.filter((h) => new Date(h.timestamp).getTime() > cutoffTime);
    this.trafficHistory.set(sourceIp, filtered);
  }

  detectAttackPattern(sourceIp: string): DetectionAlert | null {
    const history = this.trafficHistory.get(sourceIp) || [];
    if (history.length < 10) return null;

    const suspicious = history.filter((h) => h.is_suspicious);
    const suspiciousRate = suspicious.length / history.length;

    if (suspiciousRate > 0.7) {
      const avgRate = history.reduce((sum, h) => sum + h.request_rate, 0) / history.length;
      const avgThreatScore = suspicious.reduce((sum, h) => sum + h.threat_score, 0) / suspicious.length;

      let alertType = 'Unknown DoS Attack';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

      if (avgRate > 500) {
        alertType = 'High-Rate Flooding Attack';
        severity = 'critical';
      } else if (avgRate > 200) {
        alertType = 'Volumetric DoS Attack';
        severity = 'high';
      } else if (suspicious.some((h) => h.packet_size < 100)) {
        alertType = 'Low-Rate DoS Attack';
        severity = 'medium';
      } else if (suspicious.some((h) => this.SUSPICIOUS_PORTS.includes(h.port))) {
        alertType = 'Targeted Port Attack';
        severity = 'high';
      }

      if (avgThreatScore > 0.8) {
        severity = severity === 'critical' ? 'critical' : 'high';
      }

      return {
        alert_type: alertType,
        severity,
        source_ip: sourceIp,
        target: history[0]?.destination_ip || 'unknown',
        detection_time: new Date().toISOString(),
        packet_count: history.length,
        avg_request_rate: avgRate,
        status: 'active',
      };
    }

    return null;
  }

  calculateIPReputation(sourceIp: string): IPReputation {
    const history = this.trafficHistory.get(sourceIp) || [];
    const suspicious = history.filter((h) => h.is_suspicious);
    const totalRequests = history.length;
    const suspiciousRequests = suspicious.length;

    let reputationScore = 50;

    if (totalRequests > 0) {
      const suspiciousRate = suspiciousRequests / totalRequests;
      reputationScore = Math.max(0, 100 - suspiciousRate * 100);

      if (suspiciousRate > 0.5) {
        reputationScore -= 20;
      }

      if (history.some((h) => h.request_rate > 500)) {
        reputationScore -= 15;
      }
    }

    const isBlocked = reputationScore < 30;
    const blockReason = isBlocked
      ? `High suspicious activity rate: ${((suspiciousRequests / totalRequests) * 100).toFixed(1)}%`
      : undefined;

    return {
      ip_address: sourceIp,
      reputation_score: Math.max(0, Math.min(100, reputationScore)),
      total_requests: totalRequests,
      suspicious_requests: suspiciousRequests,
      is_blocked: isBlocked,
      block_reason: blockReason,
    };
  }
}

export function generateMockTraffic(): Omit<TrafficLog, 'is_suspicious' | 'threat_score'> {
  const isAttack = Math.random() > 0.7;

  const sourceIP = isAttack
    ? `192.168.1.${Math.floor(Math.random() * 10) + 100}`
    : `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  const destIP = `172.16.0.${Math.floor(Math.random() * 50) + 1}`;

  const normalPorts = [80, 443, 8080, 3000];
  const suspiciousPorts = [22, 23, 3389, 445];
  const port = isAttack && Math.random() > 0.5
    ? suspiciousPorts[Math.floor(Math.random() * suspiciousPorts.length)]
    : normalPorts[Math.floor(Math.random() * normalPorts.length)];

  const protocols = ['TCP', 'UDP', 'ICMP'];
  const protocol = protocols[Math.floor(Math.random() * protocols.length)];

  const packetSize = isAttack
    ? Math.random() > 0.5
      ? Math.floor(Math.random() * 80) + 20
      : Math.floor(Math.random() * 3000) + 1500
    : Math.floor(Math.random() * 1200) + 300;

  const requestRate = isAttack
    ? Math.floor(Math.random() * 400) + 100
    : Math.floor(Math.random() * 80) + 5;

  return {
    timestamp: new Date().toISOString(),
    source_ip: sourceIP,
    destination_ip: destIP,
    port,
    protocol,
    packet_size: packetSize,
    request_rate: requestRate,
  };
}
