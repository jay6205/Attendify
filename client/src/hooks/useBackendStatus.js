import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const _apiUrl = import.meta.env.VITE_API_URL;
const HEALTH_URL =
    typeof _apiUrl === 'string' && _apiUrl.startsWith('http')
        ? _apiUrl.replace('/api/v2', '') + '/health'
        : null;

const STATUS = {
    WARMING: 'warming',
    READY: 'ready',
    DEGRADED: 'degraded',
    ERROR: 'error',
};

/**
 * Custom hook that pings the backend health endpoint on mount.
 * Retries with backoff until the backend is ready.
 * 
 * @returns {{ status, dbStatus, retryCount, elapsed }}
 */
const useBackendStatus = () => {
    const [status, setStatus] = useState(HEALTH_URL ? STATUS.WARMING : STATUS.READY);
    const [dbStatus, setDbStatus] = useState('unknown');
    const [retryCount, setRetryCount] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const startTime = useRef(Date.now());
    const timerRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    const checkHealth = useCallback(async (attempt = 0) => {
        if (!HEALTH_URL) return;

        try {
            const res = await axios.get(HEALTH_URL, { timeout: 15000 });
            const data = res.data;

            setDbStatus(data.db || data.services?.database || 'unknown');

            if (data.status === 'OK') {
                setStatus(STATUS.READY);
                return; // Stop retrying
            } else {
                // Backend is up but DB is not connected
                setStatus(STATUS.DEGRADED);
                setRetryCount(attempt + 1);
            }
        } catch (err) {
            setRetryCount(attempt + 1);

            // After 60s of failures, give up
            if (Date.now() - startTime.current > 60000) {
                setStatus(STATUS.ERROR);
                return;
            }
        }

        // Retry with backoff: 2s, 3s, 4s, 5s (capped)
        const delay = Math.min(2000 + attempt * 1000, 5000);
        retryTimeoutRef.current = setTimeout(() => checkHealth(attempt + 1), delay);
    }, []);

    useEffect(() => {
        if (!HEALTH_URL) return;

        checkHealth(0);

        // Elapsed time counter (updates every second)
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, [checkHealth]);

    return { status, dbStatus, retryCount, elapsed, STATUS };
};

export default useBackendStatus;
