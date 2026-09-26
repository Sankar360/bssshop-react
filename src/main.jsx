// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <SettingsProvider>
                <App />
            </SettingsProvider>
        </AuthProvider>
    </StrictMode>
);