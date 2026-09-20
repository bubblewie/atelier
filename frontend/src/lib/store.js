/**
 * ATELIER — shared client-side helpers.
 *
 * The cart has always lived in `localStorage` under the "keranjang" key with
 * the exact shape the checkout endpoint expects. That contract is unchanged —
 * this module only centralises the reads/writes that used to be copy-pasted
 * into every page.
 */

export const CART_KEY = "keranjang";
export const CART_EVENT = "atelier:cart";

/* ---------------------------------------------------------------- session */

export const getUser = () => {
    try {
        const raw = localStorage.getItem("user") || localStorage.getItem("user_data");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const getUserId = (user = getUser()) => user?.id_user ?? user?.id ?? null;

export const getUserName = (user = getUser()) => user?.nama || user?.name || "";

export const isAdmin = (user = getUser()) => user?.role === "admin";

export const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

/* ------------------------------------------------------------------- cart */

export const readCart = () => {
    try {
        const data = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
};

/** Persist and notify every listening component in this tab. */
export const writeCart = (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    notifyCart();
    return items;
};

export const clearCart = () => {
    localStorage.removeItem(CART_KEY);
    notifyCart();
};

export const notifyCart = () => {
    // "storage" only fires in *other* tabs, so a custom event keeps this tab in sync.
    window.dispatchEvent(new Event(CART_EVENT));
    window.dispatchEvent(new Event("storage"));
};

/** Subscribe to cart changes; returns an unsubscribe function. */
export const subscribeCart = (handler) => {
    window.addEventListener(CART_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
        window.removeEventListener(CART_EVENT, handler);
        window.removeEventListener("storage", handler);
    };
};

export const cartCount = (items = readCart()) =>
    items.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

export const cartSubtotal = (items = readCart()) =>
    items.reduce((sum, item) => sum + Number(item.harga || 0) * Number(item.jumlah || 0), 0);

/**
 * Add one unit of a product, respecting available stock.
 * @returns {{ ok: boolean, reason?: "stock", stok?: number }}
 */
export const addToCart = (item, qty = 1) => {
    const items = readCart();
    const stok = Number(item?.stok ?? 0);
    const idx = items.findIndex((p) => Number(p.id_produk) === Number(item?.id_produk));

    if (idx !== -1) {
        const current = Number(items[idx].jumlah || 0);
        if (stok > 0 && current + qty > stok) {
            return { ok: false, reason: "stock", stok };
        }
        items[idx].jumlah = current + qty;
        items[idx].stok = stok;
    } else {
        if (stok <= 0) return { ok: false, reason: "stock", stok };
        items.push({
            id_produk: Number(item.id_produk),
            nama_produk: item.nama_produk,
            harga: Number(item.harga || 0),
            foto_produk: item.foto_produk,
            stok,
            jumlah: qty,
        });
    }

    writeCart(items);
    return { ok: true };
};

/**
 * Nudge a line item's quantity. Removing happens when it drops to zero.
 * @returns {{ removed: boolean, limited?: boolean }}
 */
export const changeQty = (index, delta) => {
    const items = readCart();
    const line = items[index];
    if (!line) return { removed: false };

    const stok = Number(line.stok || 0);
    const next = Number(line.jumlah || 0) + delta;

    if (next <= 0) {
        items.splice(index, 1);
        writeCart(items);
        return { removed: true };
    }

    if (stok > 0 && next > stok) {
        return { removed: false, limited: true, stok };
    }

    line.jumlah = next;
    writeCart(items);
    return { removed: false };
};

export const removeLine = (index) => {
    const items = readCart();
    items.splice(index, 1);
    writeCart(items);
};

/* ------------------------------------------------------------------ misc */

export const FREE_SHIPPING_THRESHOLD = 300000;
export const SHIPPING_FEE = 25000;

/** Greeting that actually respects the clock. */
export const greeting = (date = new Date()) => {
    const h = date.getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 19) return "Selamat sore";
    return "Selamat malam";
};
