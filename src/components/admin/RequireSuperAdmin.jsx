// src/components/admin/RequireSuperAdmin.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Route guard: only allows users with super_admin === 1.
 * Reads from localStorage.admin_user (set at login / check-auth).
 */
const RequireSuperAdmin = ({ children }) => {
    const isSuperAdmin = (() => {
        try {
            const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
            return Number(user.super_admin) === 1;
        } catch {
            return false;
        }
    })();

    if (!isSuperAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
};

export default RequireSuperAdmin;