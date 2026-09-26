// src/utils/toast.js
// Standalone toast utility — importable from anywhere (Login, AdminLayout, pages).
// Position: top-right. Animation: slides in from right → left.

const COLORS = {
    success: '#1cc88a',
    error:   '#e74a3b',
    warning: '#f6c23e',
    info:    '#4e73df',
};

const ICONS = {
    success: 'check-circle',
    error:   'exclamation-circle',
    warning: 'exclamation-triangle',
    info:    'info-circle',
};

const DURATION = 3500; // ms visible

/* Inject styles + keyframes once */
const ensureStyles = () => {
    if (document.getElementById('app-toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'app-toast-styles';
    style.textContent = `
        @keyframes appToastSlideIn {
            from { transform: translateX(120%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes appToastSlideOut {
            from { transform: translateX(0);    opacity: 1; }
            to   { transform: translateX(120%); opacity: 0; }
        }
        .app-toast-wrapper {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
            max-width: calc(100vw - 40px);
        }
        .app-toast {
            pointer-events: auto;
            min-width: 280px;
            max-width: 380px;
            color: #fff;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,.2);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font-size: 0.95rem;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            animation: appToastSlideIn .35s cubic-bezier(.21,1.02,.73,1) forwards;
            will-change: transform, opacity;
        }
        .app-toast.hide {
            animation: appToastSlideOut .3s ease forwards;
        }
        .app-toast .app-toast-body {
            display: flex;
            align-items: center;
            gap: 8px;
            line-height: 1.3;
            word-break: break-word;
        }
        .app-toast .app-toast-close {
            background: transparent;
            border: 0;
            color: #fff;
            font-size: 1.3rem;
            line-height: 1;
            cursor: pointer;
            opacity: .85;
            padding: 0 4px;
            flex-shrink: 0;
        }
        .app-toast .app-toast-close:hover { opacity: 1; }

        @media (max-width: 576px) {
            .app-toast-wrapper { top: 12px; right: 12px; left: 12px; }
            .app-toast { min-width: 0; max-width: 100%; }
        }
    `;
    document.head.appendChild(style);
};

/**
 * Show a toast in the top-right corner.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='success']
 * @returns {{ remove: () => void } | undefined}
 */
export const showToast = (message, type = 'success') => {
    if (!message || typeof document === 'undefined') return;

    ensureStyles();

    // Shared wrapper
    let wrapper = document.querySelector('.app-toast-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'app-toast-wrapper';
        document.body.appendChild(wrapper);
    }

    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.style.background = COLORS[type] || COLORS.info;

    // Build via DOM nodes so `message` is safely escaped (no XSS)
    const body = document.createElement('div');
    body.className = 'app-toast-body';

    const icon = document.createElement('i');
    icon.className = `bi bi-${ICONS[type] || ICONS.info}-fill`;

    const text = document.createElement('span');
    text.textContent = message;

    body.appendChild(icon);
    body.appendChild(text);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'app-toast-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';

    toast.appendChild(body);
    toast.appendChild(closeBtn);
    wrapper.appendChild(toast);

    let removed = false;
    const remove = () => {
        if (removed) return;
        removed = true;
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
            if (wrapper && wrapper.childElementCount === 0) {
                wrapper.remove();
            }
        }, 300);
    };

    closeBtn.addEventListener('click', remove);
    const timer = setTimeout(remove, DURATION);

    // If user closes early, clear the auto-timer
    closeBtn.addEventListener('click', () => clearTimeout(timer));

    return { remove };
};

export default showToast;