import React from "react";

/** Generic shimmer block. */
export const SkeletonBox = ({ width = "100%", height = 16, radius = "var(--radius-xs)", style = {} }) => (
    <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
);

/** Matches the visual footprint of ProductCard. */
export const ProductSkeleton = () => (
    <div
        style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-xl)",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 12,
        }}
    >
        <SkeletonBox height="auto" radius="var(--radius-lg)" style={{ aspectRatio: "4 / 5" }} />
        <div style={{ padding: "0 6px 10px", display: "flex", flexDirection: "column", gap: 9 }}>
            <SkeletonBox width="42%" height={11} />
            <SkeletonBox width="85%" height={16} />
            <SkeletonBox width="55%" height={18} />
        </div>
    </div>
);

/** Repeat helper: `<ProductSkeletonGrid count={8} />` */
export const ProductSkeletonGrid = ({ count = 4 }) => (
    <div className="product-grid">
        {Array.from({ length: count }).map((_, i) => (
            <ProductSkeleton key={i} />
        ))}
    </div>
);

export const TableRowSkeleton = ({ columns = 5 }) => (
    <tr>
        {Array.from({ length: columns }).map((_, idx) => (
            <td key={idx}>
                <SkeletonBox width="78%" height={16} />
            </td>
        ))}
    </tr>
);

export const CardSkeleton = () => (
    <div
        style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-xl)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
        }}
    >
        <SkeletonBox width="34%" height={12} />
        <SkeletonBox width="62%" height={28} />
    </div>
);

/** Full-width row placeholder for order lists. */
export const RowSkeleton = ({ height = 108 }) => (
    <SkeletonBox height={height} radius="var(--radius-xl)" />
);

export default SkeletonBox;
