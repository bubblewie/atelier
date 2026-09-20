import React from "react";
import { productImage, formatRupiah, handleImageError } from "./media";
import "./ProductCard.css";

/**
 * Image-first product card.
 *
 * Props are unchanged from the previous implementation:
 *   item        product record from the API (id_produk, nama_produk, harga, stok, …)
 *   onAddToCart optional — renders the quick-add action when provided
 *   onClick     optional — card press handler
 */
const ProductCard = ({ item, onAddToCart, onClick }) => {
    const stok = Number(item?.stok ?? 0);
    const soldOut = stok <= 0;
    const lowStock = !soldOut && stok <= 5;

    const handleAdd = (e) => {
        e.stopPropagation();
        if (soldOut) return;
        onAddToCart?.(item);
    };

    const handleKey = (e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <article
            className={`p-card ${soldOut ? "is-soldout" : ""}`}
            onClick={onClick}
            onKeyDown={handleKey}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="p-card-media">
                <img
                    src={productImage(item)}
                                            onError={handleImageError(item)}
                    alt={item?.nama_produk || "Produk Atelier"}
                    className="p-card-img"
                    loading="lazy"
                />

                {soldOut && <span className="badge badge-cream p-card-flag">Habis</span>}
                {lowStock && <span className="badge badge-pink p-card-flag">Sisa {stok}</span>}

                {onAddToCart && (
                    <button
                        type="button"
                        className="p-card-add"
                        onClick={handleAdd}
                        disabled={soldOut}
                        aria-label={`Tambahkan ${item?.nama_produk || "produk"} ke keranjang`}
                    >
                        <i className="bi bi-bag-plus" aria-hidden="true" />
                        <span>{soldOut ? "Stok habis" : "Tambah"}</span>
                    </button>
                )}
            </div>

            <div className="p-card-body">
                <span className="p-card-cat">{item?.kategori?.nama_kategori || "Atelier"}</span>
                <h3 className="p-card-title" title={item?.nama_produk}>
                    {item?.nama_produk || "Produk tanpa nama"}
                </h3>
                <div className="p-card-price">Rp {formatRupiah(item?.harga)}</div>
            </div>
        </article>
    );
};

export default ProductCard;
