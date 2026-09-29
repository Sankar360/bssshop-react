// src/contexts/SettingsContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import API_URL from "../api/config";

const API_BASE = API_URL;

const defaultSettings = {
    site_name: 'BSSShop',
    site_description: '',
    site_email: '',
    site_phone: '',
    site_address: '',
    store_latitude: '',
    store_longitude: '',
    social_facebook: '',
    social_twitter: '',
    social_instagram: '',
    social_youtube: '',
    social_linkedin: '',
};

const SettingsContext = createContext({
    settings: defaultSettings,
    loading: true,
    refresh: () => {},
});

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/public`, {
                headers: { Accept: 'application/json' },
            });
            const data = await res.json();
            if (data.success && data.data) {
                setSettings((s) => ({ ...s, ...data.data }));
            }
        } catch (err) {
            console.error('Settings load failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loading, refresh: load }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);