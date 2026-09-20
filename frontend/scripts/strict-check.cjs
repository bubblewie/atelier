/**
 * Pemeriksa identifier tak terdefinisi — versi ketat.
 *
 * Pemeriksa lama gagal menangkap `menunggu` yang membuat /dashboard blank,
 * karena ia memindai teks mentah: kata dalam komentar dan kalimat Indonesia
 * ikut terbaca, sehingga hasilnya tenggelam di puluhan false positive dan
 * mudah diabaikan.
 *
 * Versi ini membuang dulu komentar, string, template literal, dan teks JSX,
 * lalu hanya memeriksa identifier yang benar-benar dievaluasi sebagai
 * ekspresi. Hasilnya jauh lebih sedikit dan layak dibaca satu per satu.
 *
 * Ini tetap heuristik, bukan pengganti compiler. Tapi kelas bug yang bikin
 * layar putih — variabel dipakai tapi tidak pernah dideklarasikan — akan
 * tertangkap.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

const files = [];
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(jsx?|mjs)$/.test(p)) files.push(p);
    }
})(ROOT);

/** Buang komentar, string, template literal, regex, dan teks JSX. */
function stripNoise(src) {
    let out = "";
    let i = 0;
    let mode = null;
    let depthTpl = [];

    while (i < src.length) {
        const c = src[i];
        const n = src[i + 1];

        if (mode === "line") { if (c === "\n") { mode = null; out += "\n"; } i++; continue; }
        if (mode === "block") { if (c === "*" && n === "/") { mode = null; i++; } i++; continue; }
        if (mode === "'" || mode === '"') {
            if (c === "\\") { i += 2; continue; }
            if (c === mode) mode = null;
            i++; continue;
        }
        if (mode === "`") {
            if (c === "\\") { i += 2; continue; }
            if (c === "`") { mode = null; i++; continue; }
            // Ekspresi ${...} di dalam template TETAP diperiksa.
            if (c === "$" && n === "{") {
                mode = null; depthTpl.push(true); out += " "; i += 2; continue;
            }
            i++; continue;
        }

        if (c === "/" && n === "/") { mode = "line"; i += 2; continue; }
        if (c === "/" && n === "*") { mode = "block"; i += 2; continue; }
        if (c === "'" || c === '"' || c === "`") { mode = c; out += " "; i++; continue; }
        if (c === "}" && depthTpl.length) { depthTpl.pop(); mode = "`"; i++; continue; }

        out += c;
        i++;
    }
    return out;
}

/**
 * Buang teks JSX (isi antara > dan <) agar kalimat Indonesia di dalam
 * markup tidak dikira identifier.
 */
function stripJsxText(src) {
    return src.replace(/>([^<>{}]*)</g, (m, inner) =>
        /[{}]/.test(inner) ? m : ">" + " ".repeat(inner.length) + "<"
    );
}

const GLOBALS = new Set([
    "window","document","localStorage","sessionStorage","console","navigator","fetch",
    "setTimeout","clearTimeout","setInterval","clearInterval","requestAnimationFrame",
    "Math","JSON","Number","String","Boolean","Array","Object","Date","Promise","Error",
    "Set","Map","WeakMap","RegExp","Intl","FormData","File","FileReader","Blob","URL",
    "Event","CustomEvent","AbortController","Infinity","NaN","undefined","null","true",
    "false","require","module","process","encodeURIComponent","decodeURIComponent",
    "parseInt","parseFloat","isNaN","structuredClone","React",
]);

const KEYWORDS = new Set([
    "if","else","for","while","do","switch","case","default","break","continue","return",
    "function","const","let","var","class","extends","new","delete","typeof","instanceof",
    "in","of","this","super","import","export","from","as","async","await","try","catch",
    "finally","throw","yield","void","static","get","set","key","ref",
]);

const problems = [];

for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const src = stripJsxText(stripNoise(raw));

    const declared = new Set([...GLOBALS, ...KEYWORDS]);

    // deklarasi
    for (const m of src.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
    /*
     * Destructuring & properti objek.
     *
     * `(` SENGAJA TIDAK dimasukkan di sini. Versi sebelumnya ikut
     * mencocokkan `(nama`, sehingga pemakaian biasa seperti
     * `(menunggu > 0 || ...)` dikira deklarasi parameter — dan justru
     * itulah yang membuat bug penyebab layar putih lolos dari
     * pemeriksaan. Parameter fungsi ditangani terpisah di bawah.
     */
    for (const m of src.matchAll(/[[,]\s*\.{0,3}\s*([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);

    /*
     * Destructuring dengan kurung kurawal HANYA diakui bila memang
     * didahului const/let/var/import. `{` polos tidak boleh dianggap
     * deklarasi, karena di JSX `{menunggu}` adalah PEMAKAIAN variabel —
     * bukan pengikatan. Kekeliruan itu yang menyembunyikan bug penyebab
     * layar putih pada /dashboard.
     */
    for (const m of src.matchAll(/(?:const|let|var|import)\s*\{([^}]*)\}/g)) {
        for (const n of m[1].matchAll(/([A-Za-z_$][\w$]*)/g)) declared.add(n[1]);
    }

    // Parameter fungsi: hanya dari posisi yang benar-benar signature.
    const paramBlocks = [
        ...src.matchAll(/\bfunction\s*[A-Za-z_$\w]*\s*\(([^)]*)\)/g),
        ...src.matchAll(/\(([^()]*)\)\s*=>/g),
    ];
    for (const m of paramBlocks) {
        for (const n of m[1].matchAll(/([A-Za-z_$][\w$]*)/g)) declared.add(n[1]);
    }
    // arrow param tunggal
    for (const m of src.matchAll(/\b([A-Za-z_$][\w$]*)\s*=>/g)) declared.add(m[1]);
    // import
    for (const m of src.matchAll(/import\s+([\s\S]*?)\s+from/g)) {
        for (const n of m[1].matchAll(/([A-Za-z_$][\w$]*)/g)) declared.add(n[1]);
    }
    // label objek  { foo: ... }
    for (const m of src.matchAll(/([A-Za-z_$][\w$]*)\s*:/g)) declared.add(m[1]);
    // catch(e)
    for (const m of src.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);

    /*
     * Yang diperiksa: identifier yang dipakai sebagai ekspresi di dalam
     * kurung kurawal JSX atau setelah operator — bukan properti (.foo),
     * bukan nama komponen JSX (<Foo>), bukan atribut.
     */
    const used = new Set();
    /*
     * `[!\s]*` di depan identifier: tanpa ini, pemakaian yang diawali
     * operator unary seperti `(!quickView)` tidak terbaca sebagai
     * pemakaian — dan variabel mati pun lolos dari pemeriksaan.
     */
    for (const m of src.matchAll(/\{\s*!*\s*([a-z_$][\w$]*)\s*(?=[.[\]?!<>=&|)+\-*/%,}\s])/g)) used.add(m[1]);
    for (const m of src.matchAll(/(?:&&|\|\||[?:(=,]|\breturn\b)\s*!*\s*([a-z_$][\w$]*)\s*(?=[.[?!<>=&|)+\-*/%,;}\s])/g)) used.add(m[1]);

    for (const name of used) {
        if (declared.has(name)) continue;

        // Buang atribut JSX (`className=`, `onClick=`, `aria-hidden=`).
        // Nama yang muncul dalam bentuk `nama=` hampir selalu atribut,
        // bukan pembacaan variabel.
        const asAttribute = new RegExp(`\\b${name}\\s*=(?!=)`).test(src);
        if (asAttribute) continue;

        // Buang nama tag JSX (`<div`, `<span`).
        const asTag = new RegExp(`<\\s*${name}\\b`).test(src);
        if (asTag) continue;

        // Atribut boolean tanpa nilai (`autoFocus`, `required`, `compact`)
        // dan atribut ber-tanda hubung (`aria-hidden` -> potongan "aria").
        const asBareAttr = new RegExp(`\\s${name}(\\s*/?>|\\s+[a-zA-Z-]+=|-[a-z])`).test(src);
        if (asBareAttr) continue;

        /*
         * Pemeriksaan terakhir terhadap sumber MENTAH.
         * Penghapusan template literal bertingkat kadang ikut memakan
         * baris deklarasi, sehingga variabel yang sebenarnya ada
         * terlaporkan keliru. Kalau di file aslinya ada deklarasi
         * eksplisit untuk nama ini, abaikan.
         */
        const declaredInRaw = new RegExp(
            `(?:const|let|var|function|class)\\s+${name}\\b|\\bthis\\.${name}\\b`
        ).test(raw);
        if (declaredInRaw) continue;

        problems.push(`${path.relative(ROOT, file)} -> "${name}"`);
    }
}

const unique = [...new Set(problems)];

console.log(`Strict scan: ${files.length} file JS/JSX.\n`);

if (unique.length === 0) {
    console.log("PASS  tidak ada identifier yang dipakai tanpa deklarasi.");
    process.exit(0);
}

console.log(`FOUND ${unique.length} identifier mencurigakan:`);
unique.forEach((p) => console.log("  - " + p));
process.exit(1);
