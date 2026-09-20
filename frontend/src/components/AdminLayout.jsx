import React, { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminSidebar from "./AdminSidebar";
import ThemeToggle from "./common/ThemeToggle";
import { clearSession, getUser, getUserName } from "../lib/store";
import "../pages/AdminPages.css";


const DESKTOP = 1024;
const isDesktop = () => typeof window !== "undefined" && window.innerWidth > DESKTOP;

const TITLES = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/produk", label: "Manajemen Produk" },
    { path: "/kategori", label: "Manajemen Kategori" },
    { path: "/pesanan", label: "Manajemen Pesanan" },
    { path: "/riwayat-pesanan", label: "Riwayat Pesanan" },
];

const initials = (name) =>
    String(name || "A")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("") || "A";

function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
    const user = getUser();
    const name = getUserName(user) || "Admin";

    /* Sidebar is docked on desktop and a drawer below it. */
    useEffect(() => {
        const onResize = () => setSidebarOpen(isDesktop());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    /* Close the drawer after navigating on small screens. */
    useEffect(() => {
        if (!isDesktop()) setSidebarOpen(false);
    }, [location.pathname]);

    const closeSidebar = useCallback(() => {
        if (!isDesktop()) setSidebarOpen(false);
    }, []);

    const handleLogout = useCallback(async () => {
        const token = localStorage.getItem("token");
        try {
            await api.post(`/logout`,
                {},
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            );
        } catch (error) {
            // The local session is cleared either way — the token may already be gone.
            console.error("Gagal logout:", error);
        } finally {
            clearSession();
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    const title =
        TITLES.find((t) => location.pathname.startsWith(t.path))?.label || "Atelier Studio";

    return (
        <div className="admin-shell">
            <AdminSidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} onLogout={handleLogout} />

            <div className="admin-main">
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setSidebarOpen((v) => !v)}
                            aria-label={sidebarOpen ? "Sembunyikan menu" : "Tampilkan menu"}
                            aria-expanded={sidebarOpen}
                        >
                            <i className="bi bi-list" style={{ fontSize: 20 }} aria-hidden="true" />
                        </button>
                        <span className="topbar-title">{title}</span>
                    </div>

                    <div className="topbar-right">
                        <ThemeToggle className="icon-btn" compact />
                        <span className="topbar-chip">
                            <span className="sidebar-avatar">{initials(name)}</span>
                            <span>{name}</span>
                        </span>
                        <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                            Keluar
                        </button>
                    </div>
                </header>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
