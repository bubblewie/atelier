import React from "react";
import { StickerInline } from "./Sticker";

/**
 * Shared empty / error / no-result state.
 *
 * @param {string} sticker   sticker name from the Sticker set
 * @param {string} title
 * @param {string} description
 * @param {node}   action    optional button(s)
 * @param {string} tone      "neutral" | "error"
 */
const EmptyState = ({ sticker = "leaf", title, description, action, tone = "neutral" }) => (
    <div className="state-block fade-up">
        <span
            className="sticker"
            style={{ position: "absolute", top: 18, left: 26, opacity: 0.5 }}
            aria-hidden="true"
        >
            <StickerInline name="ring" size={54} rotate={-8} />
        </span>
        <span
            className="sticker"
            style={{ position: "absolute", bottom: 20, right: 26, opacity: 0.6 }}
            aria-hidden="true"
        >
            <StickerInline name="sparkle" size={30} rotate={12} />
        </span>

        <div
            className="state-art"
            style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: tone === "error" ? "var(--error-bg)" : "var(--mint-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <StickerInline name={tone === "error" ? "star" : sticker} size={46} />
        </div>

        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {action}
    </div>
);

export default EmptyState;
