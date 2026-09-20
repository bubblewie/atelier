import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getUser, getUserName } from "../lib/store";

const NAV = [
    {
        section: "Ikhtisar",
        items: [{ to: "/dashboard", label: "Dashboard", icon: "bi-columns-gap", exact: true }],
    },
    {
        section: "Katalog",
        items: [
            { to: "/produk", label: "Produk", icon: "bi-box-seam" },
            { to: "/kategori", label: "Kategori", icon: "bi-tags" },
        ],
    },
    {
        section: "Penjualan",
        items: [
            { to: "/pesanan", label: "Pesanan", icon: "bi-bag-check" },
            { to: "/pembayaran", label: "Pembayaran", icon: "bi-credit-card" },
            { to: "/riwayat-pesanan", label: "Riwayat", icon: "bi-clock-history" },
            { to: "/pengguna", label: "Pengguna", icon: "bi-people" },
            { to: "/laporan", label: "Laporan", icon: "bi-graph-up" },
            { to: "/backup", label: "Backup Database", icon: "bi-hdd" },
            { to: "/settings", label: "Settings", icon: "bi-gear" },
        ],
    },
];

const initials = (name) =>
    String(name || "A")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("") || "A";

function AdminSidebar({ isOpen, closeSidebar, onLogout }) {
    const location = useLocation();
    const user = getUser();
    const name = getUserName(user) || "Admin";

    const isActive = (path, exact) =>
        exact ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <>
            {isOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

            <aside className={`admin-sidebar ${isOpen ? "open" : ""}`} aria-label="Navigasi admin">
                <div className="sidebar-brand">
                    <span>
                        <span className="sidebar-brand-text">Atelier</span>
                        <span className="sidebar-brand-sub">Studio</span>
                    </span>
                </div>

                <div className="sidebar-user">
                    <span className="sidebar-avatar">{initials(name)}</span>
                    <span style={{ minWidth: 0 }}>
                        <span className="sidebar-user-name" style={{ display: "block" }}>
                            {name}
                        </span>
                        <span className="sidebar-user-mail" style={{ display: "block" }}>
                            {user?.email || "—"}
                        </span>
                    </span>
                </div>

                <nav className="sidebar-nav">
                    {NAV.map((group) => (
                        <React.Fragment key={group.section}>
                            <div className="sidebar-section">{group.section}</div>
                            {group.items.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`sidebar-link ${isActive(item.to, item.exact) ? "active" : ""}`}
                                    onClick={closeSidebar}
                                >
                                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                                    {item.label}
                                </Link>
                            ))}
                        </React.Fragment>
                    ))}
                </nav>

                <div className="sidebar-foot">
                    <Link to="/" className="sidebar-link" onClick={closeSidebar}>
                        <i className="bi bi-shop" aria-hidden="true" />
                        Lihat toko
                    </Link>
                    <button type="button" className="sidebar-link danger" onClick={onLogout}>
                        <i className="bi bi-box-arrow-right" aria-hidden="true" />
                        Keluar
                    </button>
                </div>
            </aside>
        </>
    );
}

export default AdminSidebar;
