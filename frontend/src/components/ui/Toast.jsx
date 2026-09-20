import React from "react";

const ICONS = {
    success: "bi-check-lg",
    error: "bi-x-lg",
    warning: "bi-exclamation-lg",
    info: "bi-stars",
};

/**
 * Single toast notification. Rendered inside a `.toast-container`.
 * API unchanged: { message, type, onClose }.
 */
const Toast = ({ message, type = "info", onClose }) => {
    if (!message) return null;

    return (
        <div className={`toast toast-${type}`} role="status" aria-live="polite">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="toast-mark">
                    <i className={`bi ${ICONS[type] || ICONS.info}`} aria-hidden="true" />
                </span>
                <span>{message}</span>
            </div>

            {onClose && (
                <button className="toast-close" onClick={onClose} aria-label="Tutup notifikasi" type="button">
                    <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
            )}
        </div>
    );
};

/** Convenience wrapper so pages don't repeat the container markup. */
export const ToastHost = ({ message, type, onClose }) => (
    <div className="toast-container">
        <Toast message={message} type={type} onClose={onClose} />
    </div>
);

export default Toast;
