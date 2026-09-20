/**
 * Cross-check kontrak API.
 *
 * Membandingkan SETIAP pemanggilan API di frontend dengan route yang
 * benar-benar terdaftar di routes/api.php. Ini menangkap kelas bug yang
 * tidak terlihat sampai fitur diklik saat demo: endpoint salah ketik,
 * method keliru, atau route yang belum pernah dibuat — semuanya berujung
 * 404/405 di browser.
 *
 * Jalankan: node scripts/api-check.cjs
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src");
const ROUTES = path.join(__dirname, "..", "..", "backend", "routes", "api.php");

if (!fs.existsSync(ROUTES)) {
    console.log(`SKIP  routes/api.php tidak ditemukan di ${ROUTES}`);
    console.log("      Letakkan folder backend bersebelahan dengan frontend, atau sesuaikan konstanta ROUTES.");
    process.exit(0);
}

/* ------------------------------------------------ route backend */
let php = fs.readFileSync(ROUTES, "utf8");

// Buang komentar PHP dulu. Tanpa ini, contoh route yang ditulis di dalam
// blok komentar penjelasan ikut terbaca sebagai route sungguhan.
php = php
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/^\s*\|.*$/gm, "");

const backend = [];
for (const m of php.matchAll(/Route::(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g)) {
    backend.push({ method: m[1].toUpperCase(), path: m[2].replace(/^\//, "") });
}

/** Ubah `pesanan/{id}/status` jadi regex. */
const toRegex = (p) =>
    new RegExp("^" + p.replace(/\{[^}]+\}/g, "[^/]+").replace(/\//g, "\\/") + "$");

const backendMatchers = backend.map((r) => ({ ...r, re: toRegex(r.path) }));

/* ------------------------------------------------ panggilan frontend */
const files = [];
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(jsx?|mjs)$/.test(p)) files.push(p);
    }
})(SRC);

const calls = [];
for (const file of files) {
    const src = fs.readFileSync(file, "utf8");

    for (const m of src.matchAll(/\bapi\.(get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)[`'"]/g)) {
        let method = m[1].toUpperCase();

        /*
         * Method spoofing Laravel: upload multipart tidak bisa dikirim
         * sebagai PUT dari browser, jadi frontend mengirim POST dengan
         * field `_method: PUT`. Laravel menerjemahkannya kembali jadi PUT,
         * sehingga route PUT-lah yang cocok — bukan POST.
         */
        if (method === "POST" && /_method["']?\s*[,:]\s*["']PUT/i.test(src)) {
            const spoofed = src.slice(Math.max(0, m.index - 900), m.index + 900);
            if (/_method/.test(spoofed)) method = "PUT";
        }

        calls.push({
            method,
            // `${id}` -> placeholder, supaya cocok dengan {id} di route
            raw: m[2],
            path: m[2].replace(/^\//, "").replace(/\$\{[^}]+\}/g, ":p"),
            file: path.relative(SRC, file),
        });
    }
}

/* ------------------------------------------------ bandingkan */
const problems = [];
const used = new Set();

for (const c of calls) {
    const candidate = c.path.replace(/:p/g, "X");
    const hit = backendMatchers.find((r) => r.method === c.method && r.re.test(candidate));

    if (hit) {
        used.add(`${hit.method} ${hit.path}`);
        continue;
    }

    // Apakah path-nya ada tapi methodnya beda?
    const pathOnly = backendMatchers.find((r) => r.re.test(candidate));
    problems.push(
        pathOnly
            ? `METHOD SALAH   ${c.file}: ${c.method} /${c.raw}  (backend punya ${pathOnly.method} /${pathOnly.path})`
            : `TIDAK TERDAFTAR ${c.file}: ${c.method} /${c.raw}`
    );
}

/* ------------------------------------------------ laporan */
console.log(`Backend: ${backend.length} route.  Frontend: ${calls.length} pemanggilan.\n`);

const unused = backendMatchers
    .map((r) => `${r.method} ${r.path}`)
    .filter((k) => !used.has(k));

if (problems.length === 0) {
    console.log("PASS  semua pemanggilan API frontend cocok dengan route backend.");
} else {
    console.log(`FOUND ${problems.length} masalah kontrak API:`);
    [...new Set(problems)].forEach((p) => console.log("  - " + p));
}

if (unused.length) {
    console.log(`\nRoute backend yang belum dipakai frontend (${unused.length}) — informatif saja:`);
    unused.forEach((u) => console.log("  · " + u));
}

process.exit(problems.length ? 1 : 0);
