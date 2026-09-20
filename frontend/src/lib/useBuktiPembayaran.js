import { useEffect, useState } from "react";
import api from "../api/axios";

/**
 * Mengambil file bukti pembayaran dari endpoint terproteksi
 * `GET /pesanan/{id}/bukti-pembayaran`.
 *
 * File disimpan di disk privat backend, jadi tidak bisa dipasang
 * langsung ke `<img src>` — request-nya butuh Bearer token. Hook ini
 * mengunduhnya sebagai blob lalu membuat object URL sementara, dan
 * mencabutnya kembali saat komponen dilepas agar memori tidak bocor.
 *
 * @param {number|string|null} idPesanan  null/undefined = tidak memuat apa pun
 * @param {boolean} enabled               false untuk menunda pemuatan
 */
export default function useBuktiPembayaran(idPesanan, enabled = true) {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!idPesanan || !enabled) {
            setUrl("");
            setError("");
            return undefined;
        }

        let objectUrl = "";
        let batal = false;

        const ambil = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(`/pesanan/${idPesanan}/bukti-pembayaran`, {
                    responseType: "blob",
                });

                if (batal) return;

                objectUrl = URL.createObjectURL(response.data);
                setUrl(objectUrl);
            } catch (e) {
                if (batal) return;

                const status = e.response?.status;
                setError(
                    status === 404
                        ? "Bukti pembayaran belum diunggah."
                        : status === 403
                          ? "Kamu tidak berhak melihat bukti ini."
                          : "Gagal memuat bukti pembayaran."
                );
                setUrl("");
            } finally {
                if (!batal) setLoading(false);
            }
        };

        ambil();

        return () => {
            batal = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [idPesanan, enabled]);

    return { url, loading, error };
}
