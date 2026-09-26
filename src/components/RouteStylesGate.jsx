// src/components/RouteStylesGate.jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loadStylesForPath } from '../loadStyles';
import { loadScriptsForPath } from '../loadScripts';

export default function RouteStylesGate({ children }) {
    const { pathname } = useLocation();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setReady(false);

        Promise.all([
            loadStylesForPath(pathname),
            // Make sure loadScriptsForPath returns a Promise!
            Promise.resolve(loadScriptsForPath(pathname)),
        ]).then(() => {
            if (!cancelled) setReady(true);
        });

        return () => {
            cancelled = true;
        };
    }, [pathname]);

    if (!ready) {
        // Minimal placeholder — avoids a blank screen for a frame
        return <div style={{ minHeight: '100vh' }} />;
    }

    return children;
}