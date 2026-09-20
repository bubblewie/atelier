import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

// =====================================================
// INTERCEPTOR REQUEST
// =====================================================

api.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem("token");

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        // =====================================================
        // UPLOAD FILE
        // =====================================================
        // Instance ini memasang default Content-Type
        // application/json. Untuk FormData, header itu HARUS
        // dilepas supaya browser yang menuliskannya sendiri
        // lengkap dengan parameter `boundary`.
        //
        // Kalau Content-Type ditulis manual sebagai
        // "multipart/form-data" tanpa boundary, PHP tidak bisa
        // memisahkan bagian-bagian body-nya: $request->hasFile()
        // mengembalikan false dan file tidak pernah tersimpan —
        // tanpa pesan error apa pun.

        const isFormData =
            typeof FormData !== "undefined" &&
            config.data instanceof FormData;

        if (isFormData) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

// =====================================================
// INTERCEPTOR RESPONSE
// =====================================================

api.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {

        if (
            error.response?.status === 401
        ) {

            console.warn(
                "Token tidak valid atau sudah expired."
            );

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );
        }

        return Promise.reject(error);
    }
);

export default api;