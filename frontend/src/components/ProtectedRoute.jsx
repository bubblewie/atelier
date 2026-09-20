import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser, isAdmin } from "../lib/store";

/**
 * Route guard berbasis role.
 *
 * `role` menentukan siapa yang boleh masuk:
 *   undefined  → cukup login (customer maupun admin)
 *   "admin"    → hanya admin
 *   "customer" → hanya customer
 *
 * Guard ini sengaja merender `<Navigate>` SEBELUM `<Outlet>`, sehingga
 * halaman admin tidak pernah sempat ter-mount — customer tidak akan
 * melihat kedipan isi halaman admin sebelum dialihkan.
 *
 * Catatan penting: ini hanya lapisan pertama. Keamanan yang sebenarnya
 * ada di middleware `auth:sanctum` + `admin` pada backend. Guard frontend
 * mudah dilewati siapa pun yang membuka devtools.
 */
function ProtectedRoute({ role }) {
    const location = useLocation();
    const token = localStorage.getItem("token");
    const user = getUser();

    // 1. Belum login → ke halaman masuk
    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                    message: "Silakan masuk terlebih dahulu untuk melanjutkan.",
                }}
            />
        );
    }

    // 2. Token ada tapi data user rusak/hilang → paksa masuk ulang
    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                    message: "Sesi kamu tidak lengkap. Silakan masuk kembali.",
                }}
            />
        );
    }

    // 3. Area admin, tapi yang masuk customer → 403
    if (role === "admin" && !isAdmin(user)) {
        return <Navigate to="/403" replace state={{ from: location.pathname }} />;
    }

    // 4. Area khusus customer, tapi yang masuk admin → arahkan ke panel admin
    if (role === "customer" && isAdmin(user)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
