import { Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import KategoriCreatePage from "./pages/KategoriCreatePage";
import KategoriEditPage from "./pages/KategoriEditPage";
import KategoriListPage from "./pages/KategoriListPage";
import ProdukCreatePage from "./pages/produk/ProdukCreatePage";
import ProdukEditPage from "./pages/produk/ProdukEditPage";
import ProdukListPage from "./pages/produk/ProdukListPage";
import PesananCreatePage from "./pages/pesanan/PesananCreatePage";
import PesananDetailPage from "./pages/pesanan/PesananDetailPage";
import PesananListPage from "./pages/pesanan/PesananListPage";
import PembayaranListPage from "./pages/pembayaran/PembayaranListPage";
import PenggunaListPage from "./pages/pengguna/PenggunaListPage";
import LaporanPage from "./pages/laporan/LaporanPage";
import BackupPage from "./pages/backup/BackupPage";
import SettingsPage from "./pages/settings/SettingsPage";
import PembayaranPage from "./pages/pembayaran/PembayaranPage";
import ProfilPage from "./pages/customer/ProfilPage";
import RiwayatPesananPage from "./pages/RiwayatPesananPage";
import CustomerDashboardPage from "./pages/customer/DashboardPage";
import ProdukCustomerPage from "./pages/customer/ProdukCustomerPage";
import ProdukDetailPage from "./pages/customer/ProdukDetailPage";
import PesananSayaPage from "./pages/customer/PesananSayaPage";
import PesananDetailCustomerPage from "./pages/customer/PesananDetailCustomerPage";
import KeranjangPage from "./pages/keranjang/KeranjangPage";
import CheckoutPage from "./pages/checkout/CheckoutPage";

import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ForbiddenPage from "./pages/ForbiddenPage";

function App() {
    return (
        <Routes>

            {/* =====================================
                PUBLIC
            ====================================== */}

            <Route
                path="/"
                element={<HomePage />}
            />

            <Route
                path="/login"
                element={<LoginPage />}
            />

            <Route
                path="/register"
                element={<RegisterPage />}
            />

            {/* Produk & Keranjang bisa dilihat tanpa login
                — login baru wajib saat checkout */}
            <Route path="/customer/produk" element={<ProdukCustomerPage />} />
            <Route path="/produk/:id" element={<ProdukDetailPage />} />
            <Route path="/keranjang" element={<KeranjangPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            {/* =====================================
                PROTECTED / ADMIN
            ====================================== */}

            <Route element={<ProtectedRoute role="admin" />}>

                <Route element={<AdminLayout />}>

                    {/* DASHBOARD */}

                    <Route
                        path="/dashboard"
                        element={<DashboardPage />}
                    />


                    {/* Kategori */}

                    <Route
                        path="/kategori"
                        element={<KategoriListPage />}
                    />


                    {/* Kategori CREATE */}

                    <Route
                        path="/kategori/create"
                        element={<KategoriCreatePage />}
                    />


                    {/* Kategori EDIT */}

                    <Route
                        path="/kategori/edit/:id"
                        element={<KategoriEditPage />}
                    />

                    <Route path="/produk" element={<ProdukListPage />} />
                    <Route path="/produk/tambah" element={<ProdukCreatePage />} />
                    <Route path="/produk/edit/:id" element={<ProdukEditPage />} />
                    <Route path="/pesanan" element={<PesananListPage />} />
                    <Route path="/pesanan/tambah" element={<PesananCreatePage />} />
                    <Route path="/pesanan/detail/:id" element={<PesananDetailPage />} />
                    <Route path="/pesanan/:id" element={<PesananDetailPage />} />
                    <Route path="/pembayaran" element={<PembayaranListPage />} />
                    <Route path="/pengguna" element={<PenggunaListPage />} />
                    <Route path="/laporan" element={<LaporanPage />} />
                    <Route path="/backup" element={<BackupPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/riwayat-pesanan" element={<RiwayatPesananPage />} />

                </Route>

            </Route>

            {/* =====================================
                PROTECTED / CUSTOMER & ADMIN
                Butuh login, tanpa syarat role tertentu.
            ====================================== */}

            <Route element={<ProtectedRoute />}>

                <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
                <Route path="/customer/profil" element={<ProfilPage />} />
                <Route path="/customer/pesanan-saya" element={<PesananSayaPage />} />
                <Route path="/customer/pesanan" element={<PesananSayaPage />} />
                <Route path="/customer/pesanan/:id" element={<PesananDetailCustomerPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/pembayaran/:id" element={<PembayaranPage />} />

            </Route>

        </Routes>
    );
}

export default App;