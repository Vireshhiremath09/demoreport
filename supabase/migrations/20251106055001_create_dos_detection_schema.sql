/*
  # DoS Detection System Schema

  1. New Tables
    - `traffic_logs`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz) - When the traffic was logged
      - `source_ip` (text) - Source IP address
      - `destination_ip` (text) - Destination IP address
      - `port` (integer) - Target port
      - `protocol` (text) - Protocol type (TCP, UDP, ICMP, etc.)
      - `packet_size` (integer) - Size of the packet in bytes
      - `request_rate` (numeric) - Requests per second from this source
      - `is_suspicious` (boolean) - Flagged as suspicious by ML model
      - `threat_score` (numeric) - Confidence score (0-1)
      - `created_at` (timestamptz)

    - `detection_alerts`
      - `id` (uuid, primary key)
      - `alert_type` (text) - Type of attack detected
      - `severity` (text) - low, medium, high, critical
      - `source_ip` (text) - Attacking IP
      - `target` (text) - Target resource
      - `detection_time` (timestamptz)
      - `packet_count` (integer) - Number of packets involved
      - `avg_request_rate` (numeric) - Average request rate
      - `status` (text) - active, mitigated, false_positive
      - `mitigation_action` (text) - Action taken
      - `resolved_at` (timestamptz)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `ip_reputation`
      - `id` (uuid, primary key)
      - `ip_address` (text, unique) - IP address
      - `reputation_score` (numeric) - Score from 0-100
      - `total_requests` (integer) - Total requests from this IP
      - `suspicious_requests` (integer) - Suspicious requests count
      - `last_seen` (timestamptz)
      - `is_blocked` (boolean)
      - `block_reason` (text)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

    - `traffic_patterns`
      - `id` (uuid, primary key)
      - `time_window` (timestamptz) - Time window for aggregation
      - `total_requests` (integer)
      - `unique_sources` (integer)
      - `avg_packet_size` (numeric)
      - `suspicious_count` (integer)
      - `anomaly_detected` (boolean)
      - `pattern_data` (jsonb) - Detailed pattern analysis
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage detection system
*/

CREATE TABLE IF NOT EXISTS traffic_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  source_ip text NOT NULL,
  destination_ip text NOT NULL,
  port integer NOT NULL,
  protocol text NOT NULL DEFAULT 'TCP',
  packet_size integer NOT NULL DEFAULT 0,
  request_rate numeric NOT NULL DEFAULT 0,
  is_suspicious boolean DEFAULT false,
  threat_score numeric DEFAULT 0 CHECK (threat_score >= 0 AND threat_score <= 1),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS detection_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_ip text NOT NULL,
  target text NOT NULL,
  detection_time timestamptz NOT NULL DEFAULT now(),
  packet_count integer DEFAULT 0,
  avg_request_rate numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'false_positive')),
  mitigation_action text,
  resolved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ip_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text UNIQUE NOT NULL,
  reputation_score numeric DEFAULT 50 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  total_requests integer DEFAULT 0,
  suspicious_requests integer DEFAULT 0,
  last_seen timestamptz DEFAULT now(),
  is_blocked boolean DEFAULT false,
  block_reason text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS traffic_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_window timestamptz NOT NULL,
  total_requests integer DEFAULT 0,
  unique_sources integer DEFAULT 0,
  avg_packet_size numeric DEFAULT 0,
  suspicious_count integer DEFAULT 0,
  anomaly_detected boolean DEFAULT false,
  pattern_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_traffic_logs_timestamp ON traffic_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_source_ip ON traffic_logs(source_ip);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_suspicious ON traffic_logs(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_detection_alerts_status ON detection_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_detection_alerts_severity ON detection_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_score ON ip_reputation(reputation_score);
CREATE INDEX IF NOT EXISTS idx_traffic_patterns_window ON traffic_patterns(time_window DESC);

ALTER TABLE traffic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read traffic logs"
  ON traffic_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert traffic logs"
  ON traffic_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read detection alerts"
  ON detection_alerts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert detection alerts"
  ON detection_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update detection alerts"
  ON detection_alerts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read IP reputation"
  ON ip_reputation FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert IP reputation"
  ON ip_reputation FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update IP reputation"
  ON ip_reputation FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read traffic patterns"
  ON traffic_patterns FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert traffic patterns"
  ON traffic_patterns FOR INSERT
  WITH CHECK (true);