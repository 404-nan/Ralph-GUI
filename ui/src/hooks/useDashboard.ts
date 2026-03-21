import { useState, useEffect, useRef, useCallback } from 'react';
import type { DashboardData } from '../../../src/shared/types.ts';
import { apiClient } from '../api/client.ts';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const d = await apiClient.getDashboard();
      setData(d);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Try WebSocket
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${location.host}/ws`;
    let ws: WebSocket;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          // Clear polling when WS is connected
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'refresh' || msg.type === 'connected') {
              refresh();
            }
          } catch { /* ignore */ }
        };

        ws.onclose = () => {
          setIsConnected(false);
          wsRef.current = null;
          // Fallback to polling
          if (!pollRef.current) {
            pollRef.current = setInterval(refresh, 2000);
          }
          // Reconnect after delay
          setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        // WS not available, use polling
        if (!pollRef.current) {
          pollRef.current = setInterval(refresh, 2000);
        }
      }
    }

    connect();

    return () => {
      wsRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, refresh, isConnected };
}
