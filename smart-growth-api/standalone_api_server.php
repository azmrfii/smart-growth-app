<?php
/**
 * Standalone API Server for Smart Growth (Laravel API Emulation & Bridge)
 * Allows immediate running via: php -S 127.0.0.1:8000 standalone_api_server.php
 * Connects directly to MySQL (smart_growth) via PDO if running, or gracefully serves data.
 */

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Helper to return JSON
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Database Connection Helper
function getDb() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $host = '127.0.0.1';
    $db   = 'smart_growth';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';

    try {
        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return $pdo;
    } catch (\PDOException $e) {
        return null;
    }
}

// Read JSON Input
if (!isset($input) || empty($input)) {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? [];
}

// Helper for Role Navigation Menus (Identical to Frontend ALL_NAV_ITEMS in Sidebar.tsx)
function getSidebarMenusByRole($role) {
    $all = [
        [
            'to' => '/kelola-pengguna',
            'label' => 'Kelola Pengguna',
            'icon' => 'IconUserShield',
            'roles' => ['Super Admin'],
            'description' => 'Mengelola data pengguna sistem dan hak akses akun',
        ],
        [
            'to' => '/data-anak',
            'label' => 'Data Anak',
            'icon' => 'IconUsers',
            'roles' => ['Tata Usaha'],
            'description' => 'Kelola data anak termasuk informasi fisik dan alergi',
        ],
        [
            'to' => '/laporan-menu',
            'label' => 'Laporan Menu',
            'icon' => 'IconFileText',
            'roles' => ['Admin dapur MBG'],
            'description' => 'Akses dan unduh laporan menu mingguan yang telah disetujui',
        ],
        [
            'to' => '/standar-gizi',
            'label' => 'Standar Gizi',
            'icon' => 'IconRuler2',
            'roles' => ['Ahli Gizi'],
            'description' => 'Acuan kategori status gizi anak sebagai dasar perhitungan',
        ],
        [
            'to' => '/status-gizi',
            'label' => 'Status Gizi',
            'icon' => 'IconHeartRateMonitor',
            'roles' => ['Admin dapur MBG', 'Ahli Gizi'],
            'description' => 'Ringkasan distribusi status gizi anak terdaftar',
        ],
        [
            'to' => '/rekomendasi-menu',
            'label' => 'Rekomendasi Menu',
            'icon' => 'IconWand',
            'roles' => ['Ahli Gizi'],
            'description' => 'Buat rekomendasi menu mingguan berdasarkan kebutuhan nutrisi anak',
        ],
    ];

    return array_values(array_filter($all, function ($item) use ($role) {
        return in_array($role, $item['roles'], true);
    }));
}

// Root endpoint
if ($uri === '/' || $uri === '') {
    jsonResponse([
        'app' => 'Smart Growth API (Laravel Edition)',
        'version' => '1.0.0',
        'status' => 'online',
        'database' => getDb() ? 'MySQL Connected (smart_growth)' : 'MySQL Offline (Running in fallback mode)',
        'endpoints' => [
            'login' => 'POST /api/login',
            'logout' => 'POST /api/logout',
            'sidebar' => 'GET /api/sidebar',
            'users' => 'GET /api/users',
            'anak' => 'GET /api/anak',
            'status_gizi' => 'GET /api/status-gizi',
            'standard_gizi' => 'GET /api/standard-gizi',
            'rekomendasi_menu' => 'GET /api/rekomendasi-menu',
            'laporan_menu' => 'GET /api/laporan-menu',
        ],
    ]);
}

// Ping / Health
if ($uri === '/api/ping') {
    jsonResponse(['status' => 'ok', 'time' => date('Y-m-d H:i:s')]);
}

// 1. LOGIN (FR-01)
if ($uri === '/api/login' && $method === 'POST') {
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($username) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Username dan password wajib diisi.'], 400);
    }

    $db = getDb();
    $user = null;

    if ($db) {
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        $row = $stmt->fetch();
        if ($row) {
            if (password_verify($password, $row['password']) || $row['password'] === $password) {
                $user = $row;
            }
        }
    } else {
        $demoUsers = [
            'dimas_vikrian' => ['id_user' => 1, 'name' => 'Dimas Vikriansyah', 'username' => 'dimas_vikrian', 'password' => 'password123', 'role' => 'Super Admin', 'avatar_initials' => 'DV', 'default_page' => '/kelola-pengguna'],
            'siti_aminah' => ['id_user' => 2, 'name' => 'Siti Aminah', 'username' => 'siti_aminah', 'password' => 'password123', 'role' => 'Tata Usaha', 'avatar_initials' => 'SA', 'default_page' => '/data-anak'],
            'ratna_dewi' => ['id_user' => 3, 'name' => 'Dr. Ratna Dewi', 'username' => 'ratna_dewi', 'password' => 'password123', 'role' => 'Ahli Gizi', 'avatar_initials' => 'RD', 'default_page' => '/rekomendasi-menu'],
            'budi_santoso' => ['id_user' => 4, 'name' => 'Budi Santoso', 'username' => 'budi_santoso', 'password' => 'password123', 'role' => 'Admin dapur MBG', 'avatar_initials' => 'BS', 'default_page' => '/laporan-menu'],
        ];

        if (isset($demoUsers[$username]) && $demoUsers[$username]['password'] === $password) {
            $user = $demoUsers[$username];
        }
    }

    if (!$user) {
        jsonResponse([
            'success' => false,
            'message' => 'Username atau password tidak valid. Silakan coba lagi.',
        ], 401);
    }

    $token = bin2hex(random_bytes(24));
    $sidebarMenus = getSidebarMenusByRole($user['role']);

    jsonResponse([
        'success' => true,
        'message' => 'Login berhasil!',
        'data' => [
            'token' => $token,
            'user' => [
                'id' => "usr-{$user['id_user']}",
                'id_user' => (int) $user['id_user'],
                'username' => $user['username'],
                'name' => $user['name'],
                'role' => $user['role'],
                'avatarInitials' => $user['avatar_initials'] ?? strtoupper(substr($user['name'], 0, 2)),
                'defaultPage' => $user['default_page'] ?? '/data-anak',
            ],
            'sidebarMenus' => $sidebarMenus,
        ],
    ]);
}

// 2. LOGOUT (FR-11)
if ($uri === '/api/logout' && $method === 'POST') {
    jsonResponse([
        'success' => true,
        'message' => 'Sesi berhasil diakhiri. Anda telah keluar dari sistem.',
    ]);
}

// 3. SIDEBAR MENUS
if ($uri === '/api/sidebar' && $method === 'GET') {
    $role = $_GET['role'] ?? 'Tata Usaha';
    jsonResponse([
        'success' => true,
        'role' => $role,
        'data' => getSidebarMenusByRole($role),
    ]);
}

// 4. KELOLA PENGGUNA (FR-10, Super Admin)
if ($uri === '/api/users' || preg_match('#^/api/users/([^/]+)$#', $uri, $matches)) {
    $db = getDb();
    $targetId = $matches[1] ?? null;

    // GET /api/users
    if ($method === 'GET') {
        if ($db) {
            $stmt = $db->query("SELECT id_user, name, username, role, status, avatar_initials, created_at FROM users WHERE status != 'Deleted' ORDER BY name ASC");
            $rows = $stmt->fetchAll();
            $data = array_map(function($u) {
                return [
                    'id' => "usr-{$u['id_user']}",
                    'id_user' => (int)$u['id_user'],
                    'name' => $u['name'],
                    'username' => $u['username'],
                    'role' => $u['role'],
                    'status' => $u['status'],
                    'initials' => $u['avatar_initials'] ?? strtoupper(substr($u['name'], 0, 2)),
                    'createdAt' => date('d M Y', strtotime($u['created_at'])),
                ];
            }, $rows);
        } else {
            $data = [
                ['id' => 'usr-1', 'id_user' => 1, 'name' => 'Dimas Vikriansyah', 'username' => 'dimas_vikrian', 'role' => 'Super Admin', 'status' => 'Aktif', 'initials' => 'DV', 'createdAt' => '10 Jan 2025'],
                ['id' => 'usr-2', 'id_user' => 2, 'name' => 'Siti Aminah', 'username' => 'siti_aminah', 'role' => 'Tata Usaha', 'status' => 'Aktif', 'initials' => 'SA', 'createdAt' => '15 Jan 2025'],
                ['id' => 'usr-3', 'id_user' => 3, 'name' => 'Dr. Ratna Dewi', 'username' => 'ratna_dewi', 'role' => 'Ahli Gizi', 'status' => 'Aktif', 'initials' => 'RD', 'createdAt' => '20 Jan 2025'],
                ['id' => 'usr-4', 'id_user' => 4, 'name' => 'Budi Santoso', 'username' => 'budi_santoso', 'role' => 'Admin dapur MBG', 'status' => 'Aktif', 'initials' => 'BS', 'createdAt' => '01 Feb 2025'],
            ];
        }
        jsonResponse(['success' => true, 'data' => $data]);
    }

    // POST /api/users (Create)
    if ($method === 'POST') {
        $name = trim($input['name'] ?? '');
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? 'password123';
        $role = $input['role'] ?? 'Tata Usaha';
        $initials = strtoupper(substr($name, 0, 2));

        if (strlen($username) < 5 || strpos($username, ' ') !== false) {
            jsonResponse(['success' => false, 'message' => 'Username minimal 5 karakter dan tanpa spasi.'], 422);
        }

        if ($db) {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $db->prepare("INSERT INTO users (name, username, password, role, status, avatar_initials, default_page) VALUES (?, ?, ?, ?, 'Aktif', ?, ?)");
            $stmt->execute([$name, $username, $hash, $role, $initials, '/data-anak']);
            $id = $db->lastInsertId();
        } else {
            $id = rand(10, 999);
        }

        jsonResponse([
            'success' => true,
            'message' => 'Pengguna baru berhasil ditambahkan.',
            'data' => [
                'id' => "usr-$id",
                'name' => $name,
                'username' => $username,
                'role' => $role,
                'status' => 'Aktif',
                'initials' => $initials,
                'createdAt' => date('d M Y'),
            ],
        ], 201);
    }

    // PUT /api/users/{id}
    if ($method === 'PUT' && $targetId) {
        $cleanId = (int) str_replace('usr-', '', $targetId);
        $name = trim($input['name'] ?? '');
        $username = trim($input['username'] ?? '');
        $role = $input['role'] ?? 'Tata Usaha';
        $initials = strtoupper(substr($name, 0, 2));

        if ($db) {
            $stmt = $db->prepare("UPDATE users SET name = ?, username = ?, role = ?, avatar_initials = ? WHERE id_user = ?");
            $stmt->execute([$name, $username, $role, $initials, $cleanId]);
        }

        jsonResponse([
            'success' => true,
            'message' => 'Pengguna berhasil diperbarui.',
            'data' => [
                'id' => "usr-$cleanId",
                'name' => $name,
                'username' => $username,
                'role' => $role,
                'initials' => $initials,
            ],
        ]);
    }

    // DELETE /api/users/{id}
    if ($method === 'DELETE' && $targetId) {
        $cleanId = (int) str_replace('usr-', '', $targetId);
        if ($db) {
            $stmt = $db->prepare("UPDATE users SET status = 'Deleted' WHERE id_user = ?");
            $stmt->execute([$cleanId]);
        }
        jsonResponse(['success' => true, 'message' => 'Pengguna berhasil dinonaktifkan.']);
    }
}

// 5. KELOLA DATA ANAK (FR-02)
if ($uri === '/api/anak' || preg_match('#^/api/anak/([^/]+)$#', $uri, $matches)) {
    $db = getDb();
    $targetId = $matches[1] ?? null;

    if ($method === 'GET' && !$targetId) {
        if ($db) {
            $stmt = $db->query("SELECT * FROM anak ORDER BY id_anak ASC");
            $rows = $stmt->fetchAll();
            $data = array_map(function($k) {
                return [
                    'id' => "kid-{$k['id_anak']}",
                    'id_anak' => (int)$k['id_anak'],
                    'name' => $k['nama'],
                    'classLabel' => $k['kelas'],
                    'gender' => $k['jenis_kelamin'],
                    'ageYears' => (int) floor($k['usia_bulan'] / 12),
                    'ageDisplay' => $k['usia_display'],
                    'heightCm' => (float) $k['tinggi_badan'],
                    'weightKg' => (float) $k['berat_badan'],
                    'status' => $k['status_gizi'],
                    'alergi' => $k['alergi'] ?: '-',
                ];
            }, $rows);
        } else {
            $data = [];
        }
        jsonResponse(['success' => true, 'data' => $data]);
    }

    if ($method === 'POST') {
        $name = trim($input['name'] ?? '');
        $classLabel = $input['classLabel'] ?? 'TK A1';
        $gender = $input['gender'] ?? 'Laki-laki';
        $height = (float)($input['heightCm'] ?? 100);
        $weight = (float)($input['weightKg'] ?? 15);
        $ageDisplay = $input['ageDisplay'] ?? '5th 0bln';
        $alergi = $input['alergi'] ?? '-';

        // WHO Z-Score calculation
        $median = 110.0;
        $sd = 4.3;
        $zScore = ($height - $median) / $sd;
        if ($zScore < -3.0) $status = 'Gizi Buruk';
        elseif ($zScore < -2.0) $status = 'Gizi Kurang';
        elseif ($zScore <= 2.0) $status = 'Gizi Baik';
        elseif ($zScore <= 3.0) $status = 'Gizi Lebih';
        else $status = 'Obesitas';

        if ($db) {
            $stmt = $db->prepare("INSERT INTO anak (nama, kelas, jenis_kelamin, usia_bulan, usia_display, tinggi_badan, berat_badan, alergi, status_gizi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $classLabel, $gender, 60, $ageDisplay, $height, $weight, $alergi, $status]);
            $id = $db->lastInsertId();
        } else {
            $id = rand(100, 999);
        }

        jsonResponse([
            'success' => true,
            'message' => 'Data anak berhasil ditambahkan.',
            'data' => [
                'id' => "kid-$id",
                'name' => $name,
                'classLabel' => $classLabel,
                'gender' => $gender,
                'heightCm' => $height,
                'weightKg' => $weight,
                'status' => $status,
                'alergi' => $alergi,
            ],
        ], 201);
    }

    if ($method === 'PUT' && $targetId) {
        $cleanId = (int) str_replace('kid-', '', $targetId);
        $name = trim($input['name'] ?? '');
        $classLabel = $input['classLabel'] ?? 'TK A1';
        $gender = $input['gender'] ?? 'Laki-laki';
        $height = (float)($input['heightCm'] ?? 100);
        $weight = (float)($input['weightKg'] ?? 15);
        $alergi = $input['alergi'] ?? '-';

        $median = 110.0;
        $sd = 4.3;
        $zScore = ($height - $median) / $sd;
        if ($zScore < -3.0) $status = 'Gizi Buruk';
        elseif ($zScore < -2.0) $status = 'Gizi Kurang';
        elseif ($zScore <= 2.0) $status = 'Gizi Baik';
        elseif ($zScore <= 3.0) $status = 'Gizi Lebih';
        else $status = 'Obesitas';

        if ($db) {
            $stmt = $db->prepare("UPDATE anak SET nama = ?, kelas = ?, jenis_kelamin = ?, tinggi_badan = ?, berat_badan = ?, alergi = ?, status_gizi = ? WHERE id_anak = ?");
            $stmt->execute([$name, $classLabel, $gender, $height, $weight, $alergi, $status, $cleanId]);
        }

        jsonResponse([
            'success' => true,
            'message' => 'Data anak berhasil diperbarui.',
            'data' => [
                'id' => "kid-$cleanId",
                'name' => $name,
                'classLabel' => $classLabel,
                'heightCm' => $height,
                'weightKg' => $weight,
                'status' => $status,
                'alergi' => $alergi,
            ],
        ]);
    }

    if ($method === 'DELETE' && $targetId) {
        $cleanId = (int) str_replace('kid-', '', $targetId);
        if ($db) {
            $stmt = $db->prepare("DELETE FROM anak WHERE id_anak = ?");
            $stmt->execute([$cleanId]);
        }
        jsonResponse(['success' => true, 'message' => 'Data anak berhasil dihapus.']);
    }
}

// 6. STANDAR GIZI (FR-03)
if ($uri === '/api/standard-gizi') {
    $db = getDb();
    if ($db) {
        $stmt = $db->query("SELECT * FROM standard_gizi ORDER BY usia_tahun, jenis_kelamin");
        $tableWHO = $stmt->fetchAll();
    } else {
        $tableWHO = [
            ['usia_bulan' => 36, 'usia_tahun' => 3, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 96.1, 'sd_tinggi' => 3.70],
            ['usia_bulan' => 36, 'usia_tahun' => 3, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 95.1, 'sd_tinggi' => 3.90],
            ['usia_bulan' => 48, 'usia_tahun' => 4, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 103.3, 'sd_tinggi' => 4.10],
            ['usia_bulan' => 48, 'usia_tahun' => 4, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 102.7, 'sd_tinggi' => 4.20],
            ['usia_bulan' => 60, 'usia_tahun' => 5, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 110.0, 'sd_tinggi' => 4.30],
            ['usia_bulan' => 60, 'usia_tahun' => 5, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 109.4, 'sd_tinggi' => 4.50],
            ['usia_bulan' => 72, 'usia_tahun' => 6, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 116.0, 'sd_tinggi' => 4.60],
            ['usia_bulan' => 72, 'usia_tahun' => 6, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 115.5, 'sd_tinggi' => 4.70],
            ['usia_bulan' => 84, 'usia_tahun' => 7, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 122.0, 'sd_tinggi' => 5.00],
            ['usia_bulan' => 84, 'usia_tahun' => 7, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 121.8, 'sd_tinggi' => 5.20],
        ];
    }
    jsonResponse([
        'success' => true,
        'formula' => 'Z-Score = (Nilai Pengukuran - Median Referensi) / Standar Deviasi (SD)',
        'tableWHO' => $tableWHO,
    ]);
}

// 7. STATUS GIZI (FR-04)
if ($uri === '/api/status-gizi') {
    $db = getDb();
    if ($db) {
        $total = $db->query("SELECT count(*) as total FROM anak")->fetch()['total'] ?? 0;
        $statuses = ['Gizi Buruk', 'Gizi Kurang', 'Gizi Baik', 'Gizi Lebih', 'Obesitas'];
        $dist = [];
        foreach ($statuses as $st) {
            $stmt = $db->prepare("SELECT count(*) as c FROM anak WHERE status_gizi = ?");
            $stmt->execute([$st]);
            $c = (int) $stmt->fetch()['c'];
            $pct = $total > 0 ? (int) round(($c / $total) * 100) : 0;
            $dist[] = ['status' => $st, 'count' => $c, 'percent' => $pct];
        }
    } else {
        $dist = [
            ['status' => 'Gizi Buruk', 'count' => 3, 'percent' => 10],
            ['status' => 'Gizi Kurang', 'count' => 4, 'percent' => 13],
            ['status' => 'Gizi Baik', 'count' => 16, 'percent' => 53],
            ['status' => 'Gizi Lebih', 'count' => 3, 'percent' => 10],
            ['status' => 'Obesitas', 'count' => 4, 'percent' => 13],
        ];
    }

    jsonResponse([
        'success' => true,
        'distribution' => $dist,
    ]);
}

// 8. FOODS & REKOMENDASI MENU (FR-05, FR-06)
if ($uri === '/api/foods') {
    $db = getDb();
    if ($db) {
        $stmt = $db->query("SELECT * FROM menu_makanan ORDER BY nama_makanan ASC");
        $rows = $stmt->fetchAll();
        $foods = array_map(function($f) {
            return [
                'id' => $f['id_makanan'],
                'name' => $f['nama_makanan'],
                'category' => $f['kategori'],
                'calories' => (float)$f['kalori'],
                'protein' => (float)$f['protein'],
                'carbs' => (float)$f['karbohidrat'],
                'fat' => (float)$f['lemak'],
                'allergen' => $f['alergen'],
            ];
        }, $rows);
    } else {
        $foods = [
            ['id' => 'food-dada-ayam', 'name' => 'Dada Ayam', 'calories' => 165, 'protein' => 31, 'carbs' => 0, 'fat' => 3.6],
            ['id' => 'food-nasi-putih', 'name' => 'Nasi Putih', 'calories' => 195, 'protein' => 4, 'carbs' => 43, 'fat' => 0.4],
            ['id' => 'food-brokoli', 'name' => 'Brokoli', 'calories' => 34, 'protein' => 2.8, 'carbs' => 7, 'fat' => 0.4],
            ['id' => 'food-wortel', 'name' => 'Wortel', 'calories' => 41, 'protein' => 0.9, 'carbs' => 10, 'fat' => 0.2],
            ['id' => 'food-tempe-goreng', 'name' => 'Tempe Goreng', 'calories' => 193, 'protein' => 19, 'carbs' => 9, 'fat' => 11],
            ['id' => 'food-telur-rebus', 'name' => 'Telur Rebus', 'calories' => 155, 'protein' => 13, 'carbs' => 1.1, 'fat' => 11],
            ['id' => 'food-ikan-salmon', 'name' => 'Ikan Salmon', 'calories' => 208, 'protein' => 20, 'carbs' => 0, 'fat' => 13],
            ['id' => 'food-pisang', 'name' => 'Pisang', 'calories' => 105, 'protein' => 1.3, 'carbs' => 27, 'fat' => 0.4],
        ];
    }
    jsonResponse(['success' => true, 'data' => $foods]);
}

if ($uri === '/api/rekomendasi-menu' || preg_match('#^/api/rekomendasi-menu/([^/]+)#', $uri, $matches)) {
    $db = getDb();
    if ($method === 'GET') {
        if ($db) {
            $stmt = $db->query("SELECT * FROM rekomendasi_menu ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            $data = array_map(function($m) {
                return [
                    'id' => $m['id_rekomendasi'],
                    'title' => $m['title'],
                    'status' => $m['status'],
                    'createdBy' => $m['created_by'],
                    'createdAt' => $m['waktu_dibuat'],
                    'days' => json_decode($m['days_menu'], true) ?: [],
                    'totalKalori' => (float)$m['total_kalori'],
                    'totalProtein' => (float)$m['total_protein'],
                    'totalCarbs' => (float)$m['total_karbohidrat'],
                    'totalFat' => (float)$m['total_lemak'],
                ];
            }, $rows);
        } else {
            $data = [];
        }
        jsonResponse(['success' => true, 'data' => $data]);
    }
}

if ($uri === '/api/rekomendasi-menu/generate' && $method === 'POST') {
    jsonResponse([
        'success' => true,
        'message' => 'Rekomendasi menu mingguan berhasil digenerate otomatis.',
        'data' => [
            'Senin' => ['food-dada-ayam', 'food-nasi-putih', 'food-brokoli', 'food-wortel'],
            'Selasa' => ['food-telur-rebus', 'food-nasi-putih', 'food-tempe-goreng'],
            'Rabu' => ['food-ikan-salmon', 'food-nasi-putih', 'food-brokoli'],
            'Kamis' => ['food-dada-ayam', 'food-nasi-putih', 'food-wortel'],
            'Jumat' => ['food-telur-rebus', 'food-nasi-putih', 'food-pisang'],
        ],
    ]);
}

// 9. LAPORAN FINAL MENU (FR-07, FR-08, FR-09)
if ($uri === '/api/laporan-menu') {
    $db = getDb();
    if ($db) {
        $stmt = $db->query("SELECT * FROM laporan_menu ORDER BY tanggal DESC");
        $rows = $stmt->fetchAll();
        $reports = array_map(function($r) {
            return [
                'id' => $r['id_laporan'],
                'tanggal' => $r['tanggal'],
                'waktu' => $r['waktu'],
                'dibuatOleh' => $r['dibuat_oleh'],
                'peran' => $r['peran'],
                'periode' => $r['periode'],
                'totalPorsi' => (int)$r['total_porsi'],
                'status' => $r['status'],
                'fileDownload' => $r['file_download'],
            ];
        }, $rows);
    } else {
        $reports = [
            ['id' => 'rep-1', 'tanggal' => '2025-11-25', 'waktu' => '16.41', 'dibuatOleh' => 'Dr. Ratna Dewi', 'peran' => 'Ahli Gizi', 'periode' => 'Minggu ke-4 November 2025', 'totalPorsi' => 120, 'status' => 'Disetujui', 'fileDownload' => 'Laporan_Menu_Minggu4_Nov2025.pdf'],
            ['id' => 'rep-2', 'tanggal' => '2025-11-18', 'waktu' => '15.30', 'dibuatOleh' => 'Dr. Ratna Dewi', 'peran' => 'Ahli Gizi', 'periode' => 'Minggu ke-3 November 2025', 'totalPorsi' => 120, 'status' => 'Disetujui', 'fileDownload' => 'Laporan_Menu_Minggu3_Nov2025.pdf'],
        ];
    }
    jsonResponse(['success' => true, 'reports' => $reports]);
}

// Fallback 404
jsonResponse(['success' => false, 'message' => "Endpoint not found: $method $uri"], 404);
