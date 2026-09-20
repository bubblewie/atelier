import React from "react";

/**
 * ATELIER — Error Boundary.
 *
 * Tanpa ini, satu error runtime di komponen mana pun membuat React
 * melepas seluruh pohon dan yang tersisa hanya layar putih — tanpa
 * pesan, tanpa petunjuk, tanpa cara tahu file mana yang bermasalah.
 * Itu persis yang terjadi pada halaman /dashboard.
 *
 * Boundary ini menangkap error tersebut dan menampilkannya di layar
 * lengkap dengan pesan dan lokasi komponennya, jadi masalah berikutnya
 * bisa langsung dibaca tanpa harus membuka DevTools.
 *
 * Catatan: error boundary React hanya menangkap error saat render,
 * lifecycle, dan constructor. Error di dalam event handler atau
 * promise TIDAK tertangkap — itu tetap muncul di console.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null, info: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        // Tetap kirim ke console supaya stack trace lengkap bisa dibaca.
        console.error("Atelier ErrorBoundary menangkap error:", error, info);
        this.setState({ info });
    }

    handleReset = () => {
        this.setState({ error: null, info: null });
    };

    render() {
        const { error, info } = this.state;

        if (!error) return this.props.children;

        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    background: "var(--bg-page, #E7F5F0)",
                    fontFamily: "'Quicksand', system-ui, sans-serif",
                }}
            >
                <div
                    style={{
                        maxWidth: 720,
                        width: "100%",
                        background: "var(--bg-card, #fff)",
                        border: "1px solid var(--border-color, #D9E9E2)",
                        borderRadius: 28,
                        padding: 36,
                        boxShadow: "0 24px 60px rgba(119, 92, 86, 0.13)",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 12,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "#C96A6A",
                            fontWeight: 600,
                        }}
                    >
                        Terjadi kesalahan
                    </div>

                    <h1
                        style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontSize: 28,
                            color: "var(--text-heading, #5C433E)",
                            margin: "10px 0 12px",
                        }}
                    >
                        Halaman ini gagal dimuat
                    </h1>

                    <p style={{ color: "var(--text-muted, #8A716B)", fontSize: 15, marginBottom: 22 }}>
                        Bagian lain aplikasi masih berfungsi. Detail teknis di bawah bisa langsung
                        disalin untuk melacak sumber masalahnya.
                    </p>

                    <div
                        style={{
                            background: "#FCE9E9",
                            borderRadius: 16,
                            padding: "16px 18px",
                            marginBottom: 18,
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: 13,
                            color: "#8A3B3B",
                            wordBreak: "break-word",
                        }}
                    >
                        <strong>{error.name}:</strong> {error.message}
                    </div>

                    {info?.componentStack && (
                        <details style={{ marginBottom: 24 }}>
                            <summary
                                style={{
                                    cursor: "pointer",
                                    fontSize: 13.5,
                                    fontWeight: 600,
                                    color: "var(--text-main, #775C56)",
                                    marginBottom: 10,
                                }}
                            >
                                Lihat komponen yang bermasalah
                            </summary>
                            <pre
                                style={{
                                    background: "#F2FAF7",
                                    borderRadius: 12,
                                    padding: 16,
                                    fontSize: 12,
                                    lineHeight: 1.6,
                                    overflowX: "auto",
                                    color: "#5C433E",
                                    maxHeight: 260,
                                }}
                            >
                                {info.componentStack.trim()}
                            </pre>
                        </details>
                    )}

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={this.handleReset}
                            style={{
                                padding: "13px 26px",
                                borderRadius: 999,
                                border: "none",
                                background: "#775C56",
                                color: "#fff",
                                fontFamily: "'Fredoka', sans-serif",
                                fontSize: 15,
                                cursor: "pointer",
                            }}
                        >
                            Coba render ulang
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.assign("/")}
                            style={{
                                padding: "13px 26px",
                                borderRadius: 999,
                                border: "1.5px solid #A6D2C5",
                                background: "transparent",
                                color: "#5C433E",
                                fontFamily: "'Fredoka', sans-serif",
                                fontSize: 15,
                                cursor: "pointer",
                            }}
                        >
                            Kembali ke beranda
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
