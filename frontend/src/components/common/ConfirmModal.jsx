import React, { useEffect } from "react";
import { StickerInline } from "./Sticker";

/**
 * Elegant confirmation dialog — replaces the native `window.confirm`
 * used by the admin delete flows.
 */
const ConfirmModal = ({
    open,
    title = "Konfirmasi",
    description,
    confirmLabel = "Hapus",
    cancelLabel = "Batal",
    loading = false,
    tone = "danger",
    onConfirm,
    onCancel,
}) => {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape" && !loading) onCancel?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, loading, onCancel]);

    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={() => !loading && onCancel?.()}>
            <div
                className="modal-card narrow"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div style={{ padding: "36px 32px 30px", textAlign: "center" }}>
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            margin: "0 auto 18px",
                            background: tone === "danger" ? "var(--error-bg)" : "var(--mint-50)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <StickerInline name={tone === "danger" ? "heart" : "sparkle"} size={34} />
                    </div>

                    <h3 style={{ marginBottom: 10 }}>{title}</h3>
                    {description && (
                        <p style={{ color: "var(--text-muted)", fontSize: 14.5, marginBottom: 26 }}>{description}</p>
                    )}

                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            className={tone === "danger" ? "btn btn-danger" : "btn btn-primary"}
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading && <span className="spin" />}
                            {loading ? "Memproses..." : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
