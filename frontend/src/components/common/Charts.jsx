import React from "react";

/**
 * Chart ringan berbasis SVG, tanpa dependency.
 *
 * Project ini tidak punya library chart, dan menambahkan recharts/chart.js
 * hanya untuk dua grafik akan menambah ratusan kilobyte ke bundle. Komponen
 * di bawah memakai SVG polos dengan token warna Atelier, dan `viewBox` +
 * `preserveAspectRatio` membuatnya otomatis mengikuti lebar kontainer.
 *
 * Semua nilai berasal dari props — tidak ada data contoh di dalam file ini.
 */

const fmtShort = (n) => {
    const v = Number(n || 0);
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}jt`;
    if (v >= 1_000) return `${Math.round(v / 1000)}rb`;
    return String(v);
};

/**
 * Grafik batang.
 * @param {Array<{label: string, value: number, caption?: string}>} data
 */
export const BarChart = ({ data = [], height = 220, color = "var(--mint-400)", valueFormat = fmtShort }) => {
    if (!data.length) {
        return <p className="state-inline">Belum ada data untuk digambarkan.</p>;
    }

    const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
    const barW = 100 / data.length;

    return (
        <div className="chart-wrap">
            <svg
                viewBox={`0 0 100 ${height / 4}`}
                preserveAspectRatio="none"
                className="chart-svg"
                style={{ height }}
                role="img"
                aria-label="Grafik batang"
            >
                {[0.25, 0.5, 0.75].map((g) => (
                    <line
                        key={g}
                        x1="0"
                        x2="100"
                        y1={(height / 4) * g}
                        y2={(height / 4) * g}
                        stroke="var(--border-color)"
                        strokeWidth="0.15"
                        vectorEffect="non-scaling-stroke"
                    />
                ))}

                {data.map((d, i) => {
                    const h = ((Number(d.value) || 0) / max) * (height / 4) * 0.92;
                    return (
                        <rect
                            key={d.label + i}
                            x={i * barW + barW * 0.2}
                            y={height / 4 - h}
                            width={barW * 0.6}
                            height={Math.max(h, 0.4)}
                            rx="0.6"
                            fill={color}
                        >
                            <title>{`${d.label}: ${valueFormat(d.value)}`}</title>
                        </rect>
                    );
                })}
            </svg>

            <div className="chart-axis" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
                {data.map((d, i) => (
                    <span key={d.label + i} title={d.label}>
                        {d.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

/**
 * Grafik garis dengan area di bawahnya.
 * @param {Array<{label: string, value: number}>} data
 */
export const LineChart = ({ data = [], height = 220, color = "var(--cocoa-600)", valueFormat = fmtShort }) => {
    if (data.length < 2) {
        return <p className="state-inline">Butuh minimal dua titik data untuk grafik garis.</p>;
    }

    const H = height / 4;
    const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
    const step = 100 / (data.length - 1);

    const points = data.map((d, i) => {
        const x = i * step;
        const y = H - ((Number(d.value) || 0) / max) * H * 0.92;
        return [x, y];
    });

    const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    const area = `${path} L100,${H} L0,${H} Z`;

    return (
        <div className="chart-wrap">
            <svg
                viewBox={`0 0 100 ${H}`}
                preserveAspectRatio="none"
                className="chart-svg"
                style={{ height }}
                role="img"
                aria-label="Grafik garis"
            >
                {[0.25, 0.5, 0.75].map((g) => (
                    <line
                        key={g}
                        x1="0"
                        x2="100"
                        y1={H * g}
                        y2={H * g}
                        stroke="var(--border-color)"
                        strokeWidth="0.15"
                        vectorEffect="non-scaling-stroke"
                    />
                ))}

                <path d={area} fill="var(--mint-100)" opacity="0.55" />
                <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.6"
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {points.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="0.9" fill={color}>
                        <title>{`${data[i].label}: ${valueFormat(data[i].value)}`}</title>
                    </circle>
                ))}
            </svg>

            <div className="chart-axis" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
                {data.map((d, i) => (
                    <span key={d.label + i}>{i % Math.ceil(data.length / 10) === 0 ? d.label : ""}</span>
                ))}
            </div>
        </div>
    );
};

/** Bar horizontal untuk komposisi (metode pembayaran, produk terlaris). */
export const CompositionBars = ({ data = [], valueFormat = fmtShort }) => {
    if (!data.length) return <p className="state-inline">Belum ada data.</p>;

    const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0) || 1;
    const tones = ["var(--mint-400)", "var(--pink-200)", "var(--cream-200)", "var(--mint-200)", "var(--cocoa-400)"];

    return (
        <div className="comp-list">
            {data.map((d, i) => {
                const pct = ((Number(d.value) || 0) / total) * 100;
                return (
                    <div className="comp-row" key={d.label + i}>
                        <div className="comp-head">
                            <span>{d.label}</span>
                            <strong>{valueFormat(d.value)}</strong>
                        </div>
                        <div className="comp-track">
                            <span style={{ width: `${pct}%`, background: tones[i % tones.length] }} />
                        </div>
                        <span className="comp-pct">{pct.toFixed(1)}%</span>
                    </div>
                );
            })}
        </div>
    );
};

export default BarChart;
