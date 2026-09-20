/**
 * ATELIER — Scrapbook sticker set.
 *
 * Original inline SVG shapes drawn from the Atelier palette so decoration
 * never depends on external image URLs. Keep usage tasteful: hero, section
 * headers, promo blocks, empty states, CTA.
 */
import React from "react";

const MINT = "var(--mint-200)";
const MINT_DEEP = "var(--mint-400)";
const PINK = "var(--pink-100)";
const PINK_DEEP = "var(--pink-300)";
const CREAM = "var(--cream-200)";
const COCOA = "var(--cocoa-600)";

const shapes = {
    sparkle: (
        <path
            d="M24 2c2.4 11.6 7.9 17.2 19.5 19.6C31.9 24 26.4 29.6 24 41.2 21.6 29.6 16.1 24 4.5 21.6 16.1 19.2 21.6 13.6 24 2Z"
            fill={MINT_DEEP}
        />
    ),
    star: (
        <path
            d="M24 4.5 29.6 17l13.6 1.5-10.1 9.2 2.8 13.4L24 34.4l-11.9 6.7 2.8-13.4-10.1-9.2L18.4 17 24 4.5Z"
            fill={PINK}
            stroke={PINK_DEEP}
            strokeWidth="1.6"
            strokeLinejoin="round"
        />
    ),
    heart: (
        <path
            d="M24 42S5 30.4 5 17.9C5 11.3 10 6.5 16.2 6.5c3.9 0 6.6 1.9 7.8 4.3 1.2-2.4 3.9-4.3 7.8-4.3C38 6.5 43 11.3 43 17.9 43 30.4 24 42 24 42Z"
            fill={PINK}
            stroke={PINK_DEEP}
            strokeWidth="1.6"
            strokeLinejoin="round"
        />
    ),
    flower: (
        <g>
            <circle cx="24" cy="11" r="8" fill={MINT} />
            <circle cx="24" cy="37" r="8" fill={MINT} />
            <circle cx="11" cy="24" r="8" fill={MINT} />
            <circle cx="37" cy="24" r="8" fill={MINT} />
            <circle cx="24" cy="24" r="7" fill={CREAM} stroke={MINT_DEEP} strokeWidth="1.5" />
        </g>
    ),
    bow: (
        <g stroke={PINK_DEEP} strokeWidth="1.6" strokeLinejoin="round">
            <path d="M23 24 8 14c-2.4-1.6-5 .6-4.3 3.3l3.2 12.4c.6 2.4 3.6 3.2 5.3 1.4L23 24Z" fill={PINK} />
            <path d="M25 24 40 14c2.4-1.6 5 .6 4.3 3.3l-3.2 12.4c-.6 2.4-3.6 3.2-5.3 1.4L25 24Z" fill={PINK} />
            <circle cx="24" cy="24" r="4.5" fill={PINK_DEEP} stroke="none" />
        </g>
    ),
    tape: (
        <g>
            <rect x="3" y="16" width="42" height="16" rx="2" fill={CREAM} opacity="0.95" transform="rotate(-6 24 24)" />
            <path d="M9 20h30M9 26h24" stroke={MINT_DEEP} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" transform="rotate(-6 24 24)" />
        </g>
    ),
    leaf: (
        <path
            d="M40 8C21 8 8 19 8 32c0 3.4.9 6.2 2.3 8.4C16 30 25 23 38 20 27 25 19 32 14 42c2.5 1.3 5.4 2 8.6 2C35 44 44 33 44 18c0-4-1.2-7.4-4-10Z"
            fill={MINT}
            stroke={MINT_DEEP}
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
    ),
    dot: <circle cx="24" cy="24" r="9" fill={PINK} />,
    ring: <circle cx="24" cy="24" r="16" fill="none" stroke={MINT_DEEP} strokeWidth="3" strokeDasharray="6 7" strokeLinecap="round" />,
    pen: (
        <g>
            <path d="M36 6 42 12 18 36l-9 3 3-9L36 6Z" fill={CREAM} stroke={COCOA} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M31 11 37 17" stroke={COCOA} strokeWidth="1.6" strokeLinecap="round" />
        </g>
    ),
};

/**
 * @param {string}  name    one of the keys of `shapes`
 * @param {number}  size    px
 * @param {number}  rotate  deg
 * @param {boolean} float   gentle floating loop
 */
const Sticker = ({ name = "sparkle", size = 40, rotate = 0, float = false, className = "", style = {}, ...rest }) => {
    const shape = shapes[name] || shapes.sparkle;

    return (
        <span
            className={`sticker ${float ? "sticker-float" : ""} ${className}`}
            style={{
                "--sticker-rot": `${rotate}deg`,
                transform: float ? undefined : `rotate(${rotate}deg)`,
                width: size,
                height: size,
                lineHeight: 0,
                ...style,
            }}
            aria-hidden="true"
            {...rest}
        >
            <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" focusable="false">
                {shape}
            </svg>
        </span>
    );
};

/** Inline (non-absolute) variant, useful inside headings and empty states. */
export const StickerInline = ({ name = "sparkle", size = 22, rotate = 0, style = {} }) => (
    <span
        style={{ display: "inline-block", lineHeight: 0, transform: `rotate(${rotate}deg)`, verticalAlign: "middle", ...style }}
        aria-hidden="true"
    >
        <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" focusable="false">
            {shapes[name] || shapes.sparkle}
        </svg>
    </span>
);

export default Sticker;
