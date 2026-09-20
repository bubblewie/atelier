import React from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import CustomerFooter from "../components/CustomerFooter";
import Sticker, { StickerInline } from "../components/common/Sticker";
import { getUser, isAdmin } from "../lib/store";
import "./CustomerPages.css";

/** Halaman 403 — muncul saat customer mencoba membuka area admin. */
const ForbiddenPage = () => {
    const navigate = useNavigate();
    const user = getUser();

    return (
        <div className="customer-page-wrapper">
            <CustomerNavbar />

            <main className="page-main">
                <div className="atelier-container" style={{ position: "relative" }}>
                    <Sticker name="ring" size={90} rotate={-12} float style={{ top: 60, left: "8%", opacity: 0.5 }} />
                    <Sticker name="star" size={40} rotate={14} float style={{ top: 90, right: "10%" }} />

                    <div className="state-block" style={{ marginTop: 72 }}>
                        <div
                            className="state-art"
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: "50%",
                                background: "var(--mint-50)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <StickerInline name="leaf" size={46} />
                        </div>

                        <span className="eyebrow">403</span>
                        <h3 style={{ marginTop: 8 }}>Halaman ini bukan untukmu</h3>
                        <p>
                            Area ini hanya bisa dibuka oleh admin Atelier Studio. Kalau kamu merasa
                            seharusnya punya akses, hubungi admin toko.
                        </p>

                        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                            <button className="btn btn-primary" onClick={() => navigate("/")}>
                                Kembali ke beranda
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => navigate(isAdmin(user) ? "/dashboard" : "/customer/dashboard")}
                            >
                                Ke dashboard saya
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <CustomerFooter />
        </div>
    );
};

export default ForbiddenPage;
