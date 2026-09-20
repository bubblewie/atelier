@echo off
REM ============================================================
REM  ATELIER - PERBAIKI LINK STORAGE (Windows)
REM ============================================================
REM  Jalankan file ini dari folder craft_studio:
REM
REM      fix-storage.bat
REM
REM  Kapan perlu dijalankan?
REM  - Setelah meng-extract project dari file ZIP
REM  - Setelah menyalin/memindahkan folder project
REM  - Setelah clone dari Git
REM  - Kapan pun foto produk baru tidak muncul
REM
REM  KENAPA PERLU
REM  `public\storage` seharusnya berupa LINK ke `storage\app\public`.
REM  Proses ZIP tidak bisa menyimpan link: saat di-extract, link itu
REM  berubah jadi FOLDER BIASA berisi salinan file yang beku di waktu
REM  pengarsipan. Akibatnya foto lama tetap tampil, foto baru selalu
REM  404 - persis gejala "gambar hilang setelah restart".
REM
REM  Script ini memakai JUNCTION (mklink /J), bukan symbolic link,
REM  karena junction TIDAK memerlukan hak Administrator maupun
REM  Developer Mode. `php artisan storage:link` memakai symbolic link
REM  yang sering gagal diam-diam di Windows.
REM
REM  AMAN: yang dihapus hanya `public\storage`. Folder sumber
REM  `storage\app\public\products` TIDAK PERNAH disentuh.
REM ============================================================

setlocal

set "TARGET=%~dp0storage\app\public"
set "LINKDIR=%~dp0public\storage"

echo.
echo === ATELIER: perbaiki link storage ===
echo.

REM ---- Pastikan dijalankan dari folder yang benar ----
if not exist "%TARGET%" (
    echo [GAGAL] Folder sumber tidak ditemukan:
    echo         %TARGET%
    echo.
    echo Pastikan file ini berada di dalam folder craft_studio.
    goto :end
)

REM ---- Tampilkan kondisi saat ini ----
if exist "%LINKDIR%" (
    dir "%~dp0public" | find "storage" | find "<JUNCTION>" >nul 2>&1
    if not errorlevel 1 (
        echo [INFO] public\storage sudah berupa JUNCTION yang benar.
        echo        Tidak ada yang perlu diperbaiki.
        goto :verify
    )

    dir "%~dp0public" | find "storage" | find "<SYMLINKD>" >nul 2>&1
    if not errorlevel 1 (
        echo [INFO] public\storage berupa SYMLINK. Diganti ke junction
        echo        supaya tidak bergantung pada hak Administrator.
    ) else (
        echo [MASALAH] public\storage adalah FOLDER BIASA, bukan link.
        echo           Inilah penyebab foto produk baru tidak muncul.
    )

    echo.
    echo Menghapus public\storage yang salah...
    rmdir /S /Q "%LINKDIR%" 2>nul
    if exist "%LINKDIR%" del /F /Q "%LINKDIR%" 2>nul
)

REM ---- Buat junction ----
echo Membuat junction...
mklink /J "%LINKDIR%" "%TARGET%" >nul

if errorlevel 1 (
    echo.
    echo [GAGAL] Junction tidak bisa dibuat.
    echo         Coba jalankan Command Prompt sebagai Administrator.
    echo.
    echo Catatan: aplikasi TETAP menampilkan gambar walau langkah ini
    echo gagal, karena backend punya route cadangan /storage/{path}
    echo yang melayani file langsung dari disk. Hanya sedikit lebih
    echo lambat karena melewati PHP.
    goto :end
)

echo [OK] Junction berhasil dibuat.

:verify
echo.
echo === Verifikasi ===
dir "%~dp0public" | find "storage"
echo.
echo File di folder sumber:
dir /B "%TARGET%\products" 2>nul | find /C /V ""
echo File yang terlihat lewat public\storage:
dir /B "%LINKDIR%\products" 2>nul | find /C /V ""
echo.
echo Kedua angka di atas HARUS SAMA.
echo Kalau sama, foto produk akan tetap muncul setelah restart.

:end
echo.
pause
endlocal
