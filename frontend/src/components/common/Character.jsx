import React from "react";
import char1 from "../../assets/characters/character-1.png";
import char2 from "../../assets/characters/character-2.png";
import char3 from "../../assets/characters/character-3.png";
import "./Character.css";

/**
 * ATELIER — karakter ilustrasi.
 *
 * Tiga karakter dipakai sebagai dekorasi hero. Aset aslinya sudah punya
 * latar transparan, jadi tidak ada background removal yang bisa merusak
 * garis tepi ilustrasi — file hanya di-crop ke bounding box dan
 * diperkecil ke lebar web.
 *
 * Semua penempatan diatur lewat CSS custom property supaya posisi di
 * desktop dan mobile bisa berbeda tanpa perlu logika JavaScript.
 *
 * `aria-hidden` dipasang karena karakter murni dekoratif: pembaca layar
 * tidak perlu mengumumkannya, dan halaman tetap bermakna tanpanya.
 */
const SOURCES = {
    1: { src: char1, alt: "Ilustrasi pelajar Atelier membawa tas" },
    2: { src: char2, alt: "Ilustrasi pelajar Atelier membaca buku" },
    3: { src: char3, alt: "Ilustrasi pelajar Atelier memegang palet lukis" },
};

/**
 * @param {1|2|3} id
 * @param {number} size   lebar dalam px (desktop)
 * @param {number} rotate derajat, gunakan nilai kecil: -6, -3, 3, 5
 * @param {boolean} float animasi mengambang halus
 * @param {boolean} decorative true = sembunyikan dari pembaca layar
 */
const Character = ({
    id = 1,
    size = 200,
    rotate = 0,
    float = false,
    decorative = true,
    className = "",
    style = {},
}) => {
    const item = SOURCES[id] || SOURCES[1];

    return (
        <img
            src={item.src}
            alt={decorative ? "" : item.alt}
            aria-hidden={decorative ? "true" : undefined}
            className={`atelier-character ${float ? "is-floating" : ""} ${className}`}
            loading="lazy"
            draggable="false"
            style={{
                "--char-size": `${size}px`,
                "--char-rot": `${rotate}deg`,
                ...style,
            }}
        />
    );
};

export default Character;
