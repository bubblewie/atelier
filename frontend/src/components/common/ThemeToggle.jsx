import React, { useEffect, useState } from "react";

const readTheme = () => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") || localStorage.getItem("theme") || "light";
};

/**
 * Light / dark switch. Purely front-end — writes `data-theme` on <html>,
 * which the design tokens in index.css respond to.
 */
const ThemeToggle = ({ className = "", compact = false }) => {
    const [theme, setTheme] = useState(readTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const next = theme === "dark" ? "light" : "dark";

    return (
        <button
            type="button"
            className={className || (compact ? "icon-btn" : "btn btn-ghost btn-sm")}
            onClick={() => setTheme(next)}
            title={next === "dark" ? "Mode gelap" : "Mode terang"}
            aria-label={next === "dark" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
        >
            <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon-stars"}`} aria-hidden="true" />
            {!compact && <span>{theme === "dark" ? "Terang" : "Gelap"}</span>}
        </button>
    );
};

export default ThemeToggle;
