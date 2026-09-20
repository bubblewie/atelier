/**
 * Static QA pass for the Atelier frontend.
 *
 * The uploaded node_modules only carries the win32 rolldown binding, so
 * `vite build` cannot run in this Linux container. This script covers the two
 * failure classes that previously broke the app:
 *   1. "Failed to resolve import ..."      -> unresolved relative specifiers
 *   2. "ReferenceError: x is not defined"  -> identifiers used but never bound
 * plus named-export mismatches and truncated files.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");
const EXTS = [".jsx", ".js", ".mjs", ".css", ".json", ".png", ".svg", ".jpg"];

const problems = [];
const files = [];

(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else files.push(p);
    }
})(ROOT);

const codeFiles = files.filter((f) => /\.(jsx?|mjs)$/.test(f));
const cssFiles = files.filter((f) => f.endsWith(".css"));

const rel = (f) => path.relative(ROOT, f);

/* ------------------------------------------------------------ resolution */
function resolve(fromFile, spec) {
    if (!spec.startsWith(".")) return "bare";
    const base = path.resolve(path.dirname(fromFile), spec);
    if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
    for (const e of EXTS) if (fs.existsSync(base + e)) return base + e;
    for (const e of EXTS) {
        const idx = path.join(base, "index" + e);
        if (fs.existsSync(idx)) return idx;
    }
    return null;
}

/* --------------------------------------------------------- export lookup */
function exportsOf(file) {
    const src = fs.readFileSync(file, "utf8");
    const named = new Set();
    for (const m of src.matchAll(/^\s*export\s+(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/gm)) {
        named.add(m[1]);
    }
    for (const m of src.matchAll(/^\s*export\s*\{([^}]+)\}/gm)) {
        m[1].split(",").forEach((part) => {
            const name = part.trim().split(/\s+as\s+/).pop().trim();
            if (name) named.add(name);
        });
    }
    return { named, hasDefault: /export\s+default\s/.test(src) };
}

/* ---------------------------------------------------------- import audit */
const IMPORT_RE = /import\s+(?:([\w$]+)\s*,\s*)?(?:\{([^}]*)\}|\*\s+as\s+([\w$]+)|([\w$]+))?\s*from\s*["']([^"']+)["']|import\s+["']([^"']+)["']/g;

for (const file of codeFiles) {
    const src = fs.readFileSync(file, "utf8");

    for (const m of src.matchAll(IMPORT_RE)) {
        const spec = m[5] || m[6];
        if (!spec) continue;

        const target = resolve(file, spec);
        if (target === "bare") continue;
        if (!target) {
            problems.push(`UNRESOLVED IMPORT  ${rel(file)}  ->  "${spec}"`);
            continue;
        }

        if (!/\.(jsx?|mjs)$/.test(target)) continue;

        const { named, hasDefault } = exportsOf(target);
        const defaultName = m[1] || m[4];
        if (defaultName && !hasDefault) {
            problems.push(`NO DEFAULT EXPORT  ${rel(file)} imports "${defaultName}" from "${spec}"`);
        }
        if (m[2]) {
            m[2].split(",").forEach((part) => {
                const name = part.trim().split(/\s+as\s+/)[0].trim();
                if (name && !named.has(name)) {
                    problems.push(`MISSING NAMED EXPORT  ${rel(file)} imports { ${name} } from "${spec}"`);
                }
            });
        }
    }
}

/* --------------------------------------------------- css @import / url() */
for (const file of cssFiles) {
    const src = fs.readFileSync(file, "utf8");
    for (const m of src.matchAll(/@import\s+(?:url\()?["']([^"')]+)["']\)?/g)) {
        const spec = m[1];
        if (!spec.startsWith(".")) continue;
        if (!resolve(file, spec)) problems.push(`UNRESOLVED CSS IMPORT  ${rel(file)}  ->  "${spec}"`);
    }
}

/* ------------------------------------------------------- bracket balance */
function balance(src) {
    const pairs = { ")": "(", "]": "[", "}": "{" };
    const open = new Set(["(", "[", "{"]);
    const stack = [];
    let i = 0;
    let mode = null; // "line" | "block" | "'" | '"' | "`"

    while (i < src.length) {
        const c = src[i];
        const next = src[i + 1];

        if (mode === "line") { if (c === "\n") mode = null; i++; continue; }
        if (mode === "block") { if (c === "*" && next === "/") { mode = null; i++; } i++; continue; }
        if (mode === "'" || mode === '"' || mode === "`") {
            if (c === "\\") { i += 2; continue; }
            if (c === mode) mode = null;
            i++;
            continue;
        }

        // A slash preceded by a backslash belongs to a regex literal, not a comment.
        if (c === "/" && next === "/" && src[i - 1] !== "\\") { mode = "line"; i += 2; continue; }
        if (c === "/" && src[i - 1] === "\\") { i++; continue; }
        if (c === "/" && next === "*") { mode = "block"; i += 2; continue; }
        if (c === "'" || c === '"' || c === "`") { mode = c; i++; continue; }

        if (open.has(c)) stack.push(c);
        else if (pairs[c]) {
            if (stack.pop() !== pairs[c]) return `mismatched "${c}"`;
        }
        i++;
    }
    return stack.length ? `${stack.length} unclosed ${stack.join("")}` : null;
}

for (const file of [...codeFiles, ...cssFiles]) {
    const issue = balance(fs.readFileSync(file, "utf8"));
    if (issue) problems.push(`UNBALANCED  ${rel(file)}  (${issue})`);
}

/* ------------------------------------------- undefined identifier sweep  */
const GLOBALS = new Set([
    "window", "document", "localStorage", "sessionStorage", "console", "navigator",
    "fetch", "setTimeout", "clearTimeout", "setInterval", "clearInterval",
    "Math", "JSON", "Number", "String", "Boolean", "Array", "Object", "Date",
    "Promise", "Error", "Set", "Map", "RegExp", "Intl", "FormData", "File",
    "URL", "Event", "CustomEvent", "AbortController", "Infinity", "NaN",
    "undefined", "null", "true", "false", "require", "module", "process",
]);

const KEYWORDS = new Set([
    "if", "else", "for", "while", "do", "switch", "case", "default", "break",
    "continue", "return", "function", "const", "let", "var", "class", "extends",
    "new", "delete", "typeof", "instanceof", "in", "of", "this", "super",
    "import", "export", "from", "as", "async", "await", "try", "catch",
    "finally", "throw", "yield", "void", "static", "get", "set",
]);

for (const file of codeFiles) {
    const src = fs.readFileSync(file, "utf8");
    const declared = new Set([...GLOBALS, ...KEYWORDS]);

    // imports
    for (const m of src.matchAll(IMPORT_RE)) {
        [m[1], m[3], m[4]].forEach((n) => n && declared.add(n));
        if (m[2]) m[2].split(",").forEach((p) => {
            const n = p.trim().split(/\s+as\s+/).pop().trim();
            if (n) declared.add(n);
        });
    }
    // declarations, params, destructuring, labels
    for (const m of src.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/g)) declared.add(m[1]);
    for (const m of src.matchAll(/[{[,]\s*([A-Za-z0-9_$]+)\s*(?=[,}\]:=])/g)) declared.add(m[1]);
    for (const m of src.matchAll(/\(([^()]*)\)\s*=>/g)) {
        m[1].split(",").forEach((p) => {
            const n = p.trim().split(/[=:\s]/)[0].replace(/[{}[\].]/g, "");
            if (n) declared.add(n);
        });
    }
    for (const m of src.matchAll(/\b([A-Za-z0-9_$]+)\s*=>/g)) declared.add(m[1]);
    for (const m of src.matchAll(/function\s*[A-Za-z0-9_$]*\s*\(([^)]*)\)/g)) {
        m[1].split(",").forEach((p) => {
            const n = p.trim().split(/[=:\s]/)[0].replace(/[{}[\].]/g, "");
            if (n) declared.add(n);
        });
    }
    for (const m of src.matchAll(/catch\s*\(\s*([A-Za-z0-9_$]+)/g)) declared.add(m[1]);
    for (const m of src.matchAll(/([A-Za-z0-9_$]+)\s*:/g)) declared.add(m[1]); // object keys / labels

    // usages inside JSX expressions: {foo} {foo.bar} {foo ? ...}
    for (const m of src.matchAll(/[={(]\s*([a-z][A-Za-z0-9_$]*)\b(?!\s*:)/g)) {
        const name = m[1];
        if (!declared.has(name)) {
            problems.push(`POSSIBLY UNDEFINED  ${rel(file)}  ->  "${name}"`);
        }
    }
}

/* ------------------------------------------------------------- reporting */
const unique = [...new Set(problems)];
const hard = unique.filter((p) => !p.startsWith("POSSIBLY UNDEFINED"));
const soft = unique.filter((p) => p.startsWith("POSSIBLY UNDEFINED"));

console.log(`Scanned ${codeFiles.length} JS/JSX files and ${cssFiles.length} stylesheets.\n`);

if (hard.length === 0) console.log("PASS  no unresolved imports, missing exports, or unbalanced files.");
else {
    console.log(`FAIL  ${hard.length} blocking issue(s):`);
    hard.forEach((p) => console.log("  - " + p));
}

if (soft.length) {
    console.log(`\n${soft.length} identifier(s) to eyeball (heuristic, expect false positives):`);
    soft.slice(0, 40).forEach((p) => console.log("  ? " + p));
}

process.exit(hard.length ? 1 : 0);
