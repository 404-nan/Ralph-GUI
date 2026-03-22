import { useCallback, useEffect, useRef, useState } from 'react';

import type { DashboardData } from '../../../src/shared/types.ts';
import { ApiClientError, apiClient } from '../api/client.ts';

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Dashboard refresh failed.';
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (refresh: () => Promise<void>) => {
    if (pollRef.current !== null) {
      return;
    }
    pollRef.current = window.setInterval(() => {
      void refresh();
    }, 2500);
  };

  const refresh = useCallback(async () => {
    try {
      const next = await apiClient.getDashboard();
      setData(next);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      throw error;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        const session = await apiClient.getSession();
        if (cancelled) {
          return;
        }

        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${location.host}/ws?token=${encodeURIComponent(session.token)}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) {
            return;
          }
          setIsConnected(true);
          stopPolling();
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as { type?: string };
            if (payload.type === 'refresh' || payload.type === 'connected') {
              void refresh();
            }
          } catch {
            // Ignore malformed control frames.
          }
        };

        ws.onerror = () => {
          ws.close();
        };

        ws.onclose = () => {
          if (cancelled) {
            return;
          }
          setIsConnected(false);
          wsRef.current = null;
          startPolling(refresh);
          reconnectTimerRef.current = window.setTimeout(() => {
            void connect();
          }, 3000);
        };
      } catch (error) {
        if (cancelled) {
          return;
        }
        setIsConnected(false);
        setErrorMessage(getErrorMessage(error));
        startPolling(refresh);
        reconnectTimerRef.current = window.setTimeout(() => {
          void connect();
        }, 4000);
      }
    };

    void refresh().catch(() => undefined);
    void connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      stopPolling();
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [refresh]);

  return {
    data,
    refresh,
    isConnected,
    errorMessage,
  };
}
