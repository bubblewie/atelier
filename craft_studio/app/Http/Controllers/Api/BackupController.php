<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

/**
 * =====================================================
 * BACKUP & RESTORE DATABASE (MySQL)
 * =====================================================
 * Project ini memakai MySQL (lihat .env: DB_CONNECTION=mysql,
 * DB_DATABASE=db_craft_studio), jadi backup dilakukan dengan
 * `mysqldump` dan restore dengan client `mysql`. Hasilnya adalah
 * file .sql sungguhan yang bisa di-import ulang lewat phpMyAdmin
 * maupun command line — bukan JSON yang diganti ekstensinya.
 *
 * KEAMANAN
 * - Seluruh route controller ini berada di grup
 *   auth:sanctum + admin (lihat routes/api.php).
 * - File backup disimpan di storage/app/backups (di LUAR
 *   public/), sehingga tidak bisa diunduh lewat URL langsung.
 *   Download hanya lewat endpoint yang ikut diperiksa otorisasinya.
 * - Nama file dari klien tidak pernah dipercaya: hanya basename
 *   yang dicocokkan dengan pola nama yang kami hasilkan sendiri,
 *   sehingga path traversal (../) tidak mungkin.
 * - Kredensial database dikirim ke proses lewat variabel
 *   environment MYSQL_PWD, bukan lewat argumen command line
 *   (argumen terlihat di daftar proses sistem).
 *
 * PRASYARAT
 * Binary `mysqldump` dan `mysql` harus tersedia di PATH server.
 * Pada XAMPP biasanya ada di C:\xampp\mysql\bin. Jika tidak
 * ditemukan, endpoint mengembalikan error yang jelas — bukan
 * mengaku berhasil.
 * =====================================================
 */
class BackupController extends Controller
{
    /** Folder penyimpanan, relatif terhadap root disk 'local'. */
    private const DIR = 'backups';

    /**
     * Path absolut folder backup.
     *
     * PENTING: sejak Laravel 11 root disk 'local' adalah
     * storage/app/private — BUKAN storage/app. Karena itu path
     * TIDAK boleh disusun manual dengan storage_path('app/...'),
     * sebab hasilnya akan menunjuk folder lain daripada yang
     * dibuat oleh Storage::disk('local')->makeDirectory().
     * Ketidakcocokan itulah yang membuat mysqldump gagal dengan
     * "Can't create/write to file ... (OS errno 2)".
     *
     * Semua path sekarang diturunkan dari disk yang sama, jadi
     * tetap benar ke mana pun root-nya dikonfigurasi.
     */
    private function dir(): string
    {
        Storage::disk('local')->makeDirectory(self::DIR);

        $path = Storage::disk('local')->path(self::DIR);

        // Jaring pengaman: pastikan folder benar-benar ada di disk
        // sebelum diserahkan ke proses eksternal.
        if (!is_dir($path)) {
            @mkdir($path, 0775, true);
        }

        return rtrim(str_replace('\\', '/', $path), '/');
    }

    /** Hanya nama file dengan pola inilah yang diakui sistem. */
    private const PATTERN = '/^backup_[A-Za-z0-9_\-]+_\d{8}_\d{6}\.sql$/';

    /* ============================================================
       HELPER
       ============================================================ */

    private function dbConfig(): array
    {
        $conn = config('database.default');

        return [
            'driver'   => config("database.connections.{$conn}.driver"),
            'host'     => config("database.connections.{$conn}.host", '127.0.0.1'),
            'port'     => (string) config("database.connections.{$conn}.port", '3306'),
            'database' => config("database.connections.{$conn}.database"),
            'username' => config("database.connections.{$conn}.username"),
            'password' => (string) config("database.connections.{$conn}.password"),
        ];
    }

    /** Tolak nama file yang tidak kami hasilkan sendiri. */
    private function safePath(string $filename): ?string
    {
        $base = basename($filename);

        if (!preg_match(self::PATTERN, $base)) {
            return null;
        }

        $path = $this->dir() . '/' . $base;

        return is_file($path) ? $path : null;
    }

    /**
     * Environment untuk proses mysqldump/mysql.
     *
     * KENAPA INI PERLU
     * Di Windows, Winsock tidak bisa diinisialisasi kalau proses anak
     * kehilangan variabel SystemRoot. Gejalanya persis:
     *
     *   mysqldump: Got error: 2004: Can't create TCP/IP socket (10106)
     *
     * Angka 10106 adalah WSAEPROVIDERFAILEDINIT — bukan masalah
     * kredensial, bukan MySQL mati, melainkan lapisan socket Windows
     * yang gagal dimuat.
     *
     * Symfony Process seharusnya mewariskan environment induk, tapi
     * kalau `variables_order` di php.ini tidak memuat "E", $_ENV kosong
     * dan variabel penting itu ikut hilang. Karena itu di sini variabel
     * sistem yang dibutuhkan dipasang kembali secara eksplisit.
     *
     * Password tetap lewat MYSQL_PWD, bukan argumen command line,
     * supaya tidak terbaca di daftar proses sistem.
     */
    private function processEnv(string $password): array
    {
        $env = ['MYSQL_PWD' => $password];

        // Variabel sistem yang dibutuhkan Winsock dan resolusi path.
        foreach ([
            'SystemRoot',
            'SystemDrive',
            'WINDIR',
            'COMSPEC',
            'PATH',
            'Path',
            'PATHEXT',
            'TEMP',
            'TMP',
            'APPDATA',
            'LOCALAPPDATA',
            'USERPROFILE',
            'HOME',
            'LANG',
        ] as $key) {
            $value = getenv($key);

            if ($value !== false && $value !== '') {
                $env[$key] = $value;
            }
        }

        return $env;
    }


    private function binaryExists(string $binary): bool
    {
        $probe = new Process([$binary, '--version'], null, $this->processEnv(''));
        $probe->setTimeout(15);

        try {
            $probe->run();
            return $probe->isSuccessful();
        } catch (\Throwable $e) {
            return false;
        }
    }

    /* ============================================================
       GET /api/backup  — daftar backup
       ============================================================ */
    public function index(): JsonResponse
    {
        try {
            $dir = $this->dir();
            $items = [];

            foreach (glob($dir . '/*.sql') ?: [] as $file) {
                $name = basename($file);

                if (!preg_match(self::PATTERN, $name)) {
                    continue;
                }

                $items[] = [
                    'nama_file'   => $name,
                    'ukuran'      => filesize($file),
                    'dibuat_pada' => date('c', filemtime($file)),
                    'status'      => filesize($file) > 0 ? 'success' : 'failed',
                ];
            }

            usort($items, fn ($a, $b) => strcmp($b['dibuat_pada'], $a['dibuat_pada']));

            return response()->json([
                'status'  => 'success',
                'message' => 'Daftar backup berhasil diambil',
                'data'    => $items,
                'meta'    => [
                    'total'        => count($items),
                    'total_ukuran' => array_sum(array_column($items, 'ukuran')),
                    'terakhir'     => $items[0]['dibuat_pada'] ?? null,
                    'driver'       => $this->dbConfig()['driver'],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengambil daftar backup',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ============================================================
       POST /api/backup  — buat backup baru
       ============================================================ */
    public function store(): JsonResponse
    {
        $cfg = $this->dbConfig();

        if ($cfg['driver'] !== 'mysql') {
            return response()->json([
                'status'  => 'error',
                'message' => "Backup otomatis hanya mendukung MySQL. Driver saat ini: {$cfg['driver']}.",
            ], 422);
        }

        if (!$this->binaryExists('mysqldump')) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Perintah mysqldump tidak ditemukan di server. '
                    . 'Tambahkan folder bin MySQL (contoh: C:\\xampp\\mysql\\bin) ke PATH sistem.',
            ], 500);
        }

        $dir = $this->dir();

        if (!is_dir($dir) || !is_writable($dir)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Folder backup tidak bisa dibuat atau tidak bisa ditulis: ' . $dir,
            ], 500);
        }

        $filename = 'backup_' . $cfg['database'] . '_' . date('Ymd_His') . '.sql';
        $target   = $dir . '/' . $filename;

        $command = [
            'mysqldump',
            '--host=' . $cfg['host'],
            '--port=' . $cfg['port'],
            '--user=' . $cfg['username'],
            '--single-transaction',
            '--routines',
            '--events',
            '--default-character-set=utf8mb4',
            '--result-file=' . $target,
            $cfg['database'],
        ];

        // Password lewat environment, bukan argumen (argumen terbaca di process list).
        $process = new Process($command, null, $this->processEnv($cfg['password']));
        $process->setTimeout(300);

        try {
            $process->run();

            if (!$process->isSuccessful() || !is_file($target) || filesize($target) === 0) {

                if (is_file($target)) {
                    @unlink($target);
                }

                $stderr = trim($process->getErrorOutput()) ?: 'mysqldump tidak menghasilkan output.';

                // Terjemahkan error yang paling sering muncul agar tidak
                // membingungkan saat dibaca dari UI.
                $petunjuk = null;

                if (str_contains($stderr, '10106')) {
                    $petunjuk = 'Winsock gagal diinisialisasi untuk proses mysqldump. '
                        . 'Biasanya karena variabel SystemRoot tidak diwariskan ke proses anak. '
                        . 'Pastikan php.ini memiliki variables_order = "EGPCS", lalu restart server PHP.';
                } elseif (str_contains($stderr, '1045')) {
                    $petunjuk = 'Kredensial database ditolak. Periksa DB_USERNAME dan DB_PASSWORD di .env.';
                } elseif (str_contains($stderr, '2002') || str_contains($stderr, '2003')) {
                    $petunjuk = 'Tidak bisa terhubung ke server MySQL. Pastikan MySQL sedang berjalan '
                        . 'dan DB_HOST/DB_PORT di .env sudah benar.';
                }

                return response()->json([
                    'status'   => 'error',
                    'message'  => 'Backup database gagal dibuat.',
                    'error'    => $stderr,
                    'petunjuk' => $petunjuk,
                ], 500);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Backup database berhasil dibuat',
                'data'    => [
                    'nama_file'   => $filename,
                    'ukuran'      => filesize($target),
                    'dibuat_pada' => date('c', filemtime($target)),
                    'status'      => 'success',
                ],
            ], 201);

        } catch (ProcessTimedOutException $e) {
            @unlink($target);

            return response()->json([
                'status'  => 'error',
                'message' => 'Proses backup melebihi batas waktu 5 menit.',
            ], 500);

        } catch (\Exception $e) {
            @unlink($target);

            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal membuat backup database',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ============================================================
       GET /api/backup/{filename}/download
       ============================================================ */
    public function download(string $filename)
    {
        $path = $this->safePath($filename);

        if (!$path) {
            return response()->json([
                'status'  => 'error',
                'message' => 'File backup tidak ditemukan',
            ], 404);
        }

        return response()->download($path, basename($path), [
            'Content-Type' => 'application/sql',
        ]);
    }

    /* ============================================================
       DELETE /api/backup/{filename}
       ============================================================ */
    public function destroy(string $filename): JsonResponse
    {
        $path = $this->safePath($filename);

        if (!$path) {
            return response()->json([
                'status'  => 'error',
                'message' => 'File backup tidak ditemukan',
            ], 404);
        }

        @unlink($path);

        return response()->json([
            'status'  => 'success',
            'message' => 'Backup berhasil dihapus',
        ], 200);
    }

    /* ============================================================
       POST /api/backup/{filename}/restore
       ============================================================
       OPERASI BERISIKO. Menimpa isi database aktif dengan isi file
       backup. Hanya admin terautentikasi yang bisa memanggilnya.
       ============================================================ */
    public function restore(Request $request, string $filename): JsonResponse
    {
        $cfg = $this->dbConfig();

        if ($cfg['driver'] !== 'mysql') {
            return response()->json([
                'status'  => 'error',
                'message' => "Restore hanya mendukung MySQL. Driver saat ini: {$cfg['driver']}.",
            ], 422);
        }

        // Konfirmasi eksplisit — mencegah restore karena salah klik
        // atau karena request yang tidak disengaja.
        $request->validate([
            'konfirmasi' => 'required|in:RESTORE',
        ]);

        $path = $this->safePath($filename);

        if (!$path) {
            return response()->json([
                'status'  => 'error',
                'message' => 'File backup tidak ditemukan',
            ], 404);
        }

        if (!$this->binaryExists('mysql')) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Perintah mysql tidak ditemukan di server. '
                    . 'Tambahkan folder bin MySQL ke PATH sistem.',
            ], 500);
        }

        // Backup pengaman sebelum menimpa — supaya kondisi saat ini
        // masih bisa dikembalikan kalau restore ternyata keliru.
        $safety = $this->store();

        if ($safety->getStatusCode() !== 201) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Restore dibatalkan: backup pengaman gagal dibuat, '
                    . 'sehingga kondisi database saat ini tidak bisa dipulihkan bila terjadi masalah.',
            ], 500);
        }

        $process = Process::fromShellCommandline(
            'mysql --host=${:HOST} --port=${:PORT} --user=${:USER} '
            . '--default-character-set=utf8mb4 ${:DB} < ${:FILE}',
            null,
            array_merge($this->processEnv($cfg['password']), [
                'HOST' => $cfg['host'],
                'PORT' => $cfg['port'],
                'USER' => $cfg['username'],
                'DB'   => $cfg['database'],
                'FILE' => $path,
            ])
        );
        $process->setTimeout(300);

        try {
            $process->run();

            if (!$process->isSuccessful()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Restore database gagal. Database tidak diubah sepenuhnya — '
                        . 'periksa backup pengaman yang baru dibuat.',
                    'error'   => trim($process->getErrorOutput()),
                ], 500);
            }

            DB::reconnect();

            return response()->json([
                'status'  => 'success',
                'message' => 'Database berhasil dipulihkan dari ' . basename($path),
                'data'    => [
                    'backup_pengaman' => $safety->getData(true)['data']['nama_file'] ?? null,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal melakukan restore database',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
