-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 20, 2026 at 10:20 AM
-- Server version: 8.0.30
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_craft_studio`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_08_07_010446_create_personal_access_tokens_table', 1),
(5, '2026_09_04_000001_add_metode_pembayaran_to_tbl_pesanan_table', 2),
(6, '2026_09_05_000001_add_payment_verification_to_tbl_pesanan_table', 3);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'test', '0ad5d9bb47be362c9b45e589ea451b0ff6e1be9a3962a9031b22a5c7776683cb', '[\"*\"]', NULL, NULL, '2026-08-13 19:01:08', '2026-08-13 19:01:08'),
(2, 'App\\Models\\User', 6, 'auth_token', '5566877f5a3427a9165b201b833cdacf174e58b7f7e3f0891643c69c21d6c377', '[\"*\"]', NULL, NULL, '2026-08-13 19:41:26', '2026-08-13 19:41:26'),
(3, 'App\\Models\\User', 6, 'auth_token', '810d759b7f814edf62b35c0b9318f4da05ab6e2d45f8384994ceaab6be7ad2b6', '[\"*\"]', NULL, NULL, '2026-08-13 19:44:33', '2026-08-13 19:44:33'),
(4, 'App\\Models\\User', 6, 'auth_token', '170a8e9add6b0b9fb3d4d3e176becb17de183977182c4ded18de7711aec81228', '[\"*\"]', '2026-09-06 02:53:56', NULL, '2026-08-14 02:00:36', '2026-09-06 02:53:56'),
(5, 'App\\Models\\User', 1, 'auth_token', 'a69794a3f4499f23fb41e8eaee2429b567663d96e883e62a25fb27261cf73026', '[\"*\"]', NULL, NULL, '2026-08-14 22:38:27', '2026-08-14 22:38:27'),
(6, 'App\\Models\\User', 1, 'auth_token', 'dba412a5c97865287c55a4f28260c9fd69cdcf812bfd62d23dfda7b6c2f83e49', '[\"*\"]', NULL, NULL, '2026-08-14 22:38:34', '2026-08-14 22:38:34'),
(7, 'App\\Models\\User', 7, 'auth_token', '70f9ad51e4b05de89d8ded07c6333de99e8db08d39c2342507d4b926e2a3744a', '[\"*\"]', NULL, NULL, '2026-08-14 22:46:28', '2026-08-14 22:46:28'),
(8, 'App\\Models\\User', 7, 'auth_token', 'c71668315aac8a8f5d17ff9c94bec7e0420c7c76610aac234a5d28825801ff54', '[\"*\"]', NULL, NULL, '2026-08-14 22:46:37', '2026-08-14 22:46:37'),
(9, 'App\\Models\\User', 7, 'auth_token', '705dd74f8791b427f273f859ee7fc6949f079109e409b10e8dbc676aa7275b54', '[\"*\"]', NULL, NULL, '2026-08-14 22:47:08', '2026-08-14 22:47:08'),
(10, 'App\\Models\\User', 7, 'auth_token', 'b3e5acca604e96e12d18a068edea9fae3489bb271754b7711004de751111c33f', '[\"*\"]', NULL, NULL, '2026-08-14 22:47:44', '2026-08-14 22:47:44'),
(11, 'App\\Models\\User', 7, 'auth_token', '14b5a1a59d147147447fc85c408260c6529e24bfcbf610b0d852a67c9ceed162', '[\"*\"]', NULL, NULL, '2026-08-14 23:06:14', '2026-08-14 23:06:14'),
(12, 'App\\Models\\User', 8, 'auth_token', '7ae1ee6b125dc627027de91e27b74f7ff8314a7469daf9fdd73b1c4750e542cb', '[\"*\"]', NULL, NULL, '2026-08-14 23:09:42', '2026-08-14 23:09:42'),
(13, 'App\\Models\\User', 8, 'auth_token', '4b1ec94c408f6d5033e9e4be55b91fda0b19146199b43a3274bfbbf8380c629b', '[\"*\"]', NULL, NULL, '2026-08-14 23:09:52', '2026-08-14 23:09:52'),
(14, 'App\\Models\\User', 8, 'auth_token', '8e1e79fc3d6f27c94c64c39521f51e4571298a61345864e2c2a44a40695c0b0f', '[\"*\"]', NULL, NULL, '2026-08-14 23:49:06', '2026-08-14 23:49:06'),
(15, 'App\\Models\\User', 8, 'auth_token', '4fcce73734968380cf5024e60b128da1f2c729d6d33c3548f68396c9c07f01d8', '[\"*\"]', NULL, NULL, '2026-08-16 02:21:44', '2026-08-16 02:21:44'),
(16, 'App\\Models\\User', 8, 'auth_token', '58fe7591cbe9b932330128b4a87651dff8c56a9822013103581aeb637e947759', '[\"*\"]', NULL, NULL, '2026-08-16 03:14:50', '2026-08-16 03:14:50'),
(17, 'App\\Models\\User', 1, 'auth_token', 'b70c07c72d6770c1a4460b5fd13cba7ddd4b5933315063574391f0cdf217b878', '[\"*\"]', NULL, NULL, '2026-08-16 03:38:04', '2026-08-16 03:38:04'),
(18, 'App\\Models\\User', 1, 'auth_token', '15a0fe1063c6b5f40d782f536f3b376b3715f35bb70eb99cc293ba2db54cf232', '[\"*\"]', NULL, NULL, '2026-08-16 03:45:21', '2026-08-16 03:45:21'),
(19, 'App\\Models\\User', 9, 'auth_token', 'b2dc6257e9c1aed7285e4f66a24abaddb4060df1c21cd0dee972cf849ee38172', '[\"*\"]', NULL, NULL, '2026-08-16 04:21:46', '2026-08-16 04:21:46'),
(20, 'App\\Models\\User', 9, 'auth_token', 'af110d2f5d8216a9d344cd501f473e180937a19597ac7f0ee36ff2ed9ef7de12', '[\"*\"]', NULL, NULL, '2026-08-16 04:22:47', '2026-08-16 04:22:47'),
(21, 'App\\Models\\User', 8, 'auth_token', 'ec0e3bf30be3b5b8666307cb7113d2549577b61ecad1dd48c83b65c6a88b8178', '[\"*\"]', NULL, NULL, '2026-08-16 04:24:16', '2026-08-16 04:24:16'),
(22, 'App\\Models\\User', 9, 'auth_token', '7dddedd67a9c8ef226e0c012fc7cb261d73a7dfc58484149a66adeb5b8226565', '[\"*\"]', NULL, NULL, '2026-08-17 02:05:06', '2026-08-17 02:05:06'),
(23, 'App\\Models\\User', 8, 'auth_token', '5b6654cca8b46ada286e525a635c6ee1d23a77230d438b5c67b27a855987bcf0', '[\"*\"]', NULL, NULL, '2026-08-17 02:28:28', '2026-08-17 02:28:28'),
(24, 'App\\Models\\User', 9, 'auth_token', 'e7e8103f2dd27f2804878fc597d96944d38033591f72a8ac0fe14994f0c0d5d6', '[\"*\"]', NULL, NULL, '2026-08-27 04:34:27', '2026-08-27 04:34:27'),
(25, 'App\\Models\\User', 9, 'auth_token', '9ea0dc66896b2616258cb75f44200b89734b5920708dd8e211131fc373909ec7', '[\"*\"]', NULL, NULL, '2026-08-27 05:58:45', '2026-08-27 05:58:45'),
(26, 'App\\Models\\User', 8, 'auth_token', '8e55e0867661f7dafea626ed303ede8c0d960982a1b06225e667b46c591706ee', '[\"*\"]', NULL, NULL, '2026-08-27 06:20:37', '2026-08-27 06:20:37'),
(27, 'App\\Models\\User', 8, 'auth_token', 'ee6c4b9de1a9e40b23c6fc26ad7d3cf1ba030c9adb94a5297bfe41675d4e7fcd', '[\"*\"]', NULL, NULL, '2026-08-27 18:54:53', '2026-08-27 18:54:53'),
(28, 'App\\Models\\User', 9, 'auth_token', '24aa08586d4ef1c5e2abe0338071bd0f76287e8c78e7a93f6290722f8c6f3748', '[\"*\"]', NULL, NULL, '2026-08-27 18:55:27', '2026-08-27 18:55:27'),
(29, 'App\\Models\\User', 8, 'auth_token', '0068a88ed76639518f125a364351f22cbe010e63049573456e203fce789b1938', '[\"*\"]', NULL, NULL, '2026-08-27 19:01:16', '2026-08-27 19:01:16'),
(30, 'App\\Models\\User', 10, 'auth_token', 'b340927d538d202090cb7c947b4a718e38b5ac35b9077f79b4c1c9933d898f63', '[\"*\"]', NULL, NULL, '2026-08-27 19:29:46', '2026-08-27 19:29:46'),
(31, 'App\\Models\\User', 10, 'auth_token', '3387af36c7e9292adf71bc91b2ff87e74f7cd6abf0bf1ea05d361f4377f53fd2', '[\"*\"]', NULL, NULL, '2026-08-27 19:29:54', '2026-08-27 19:29:54'),
(32, 'App\\Models\\User', 9, 'auth_token', 'b886e90476e089ee5458ad65e386efceed7acfe07cd77c16ce86e20aeb545061', '[\"*\"]', NULL, NULL, '2026-08-27 20:05:26', '2026-08-27 20:05:26'),
(33, 'App\\Models\\User', 9, 'auth_token', '42f68fad063b8b3dc74fc5f3b4a1846d387830af060c2726be22b34c20044165', '[\"*\"]', NULL, NULL, '2026-08-27 20:05:49', '2026-08-27 20:05:49'),
(34, 'App\\Models\\User', 11, 'auth_token', '330cfc646c6dc53fd576b4317a58be23069c974e4fc666ff97a9e4fbc8716028', '[\"*\"]', NULL, NULL, '2026-08-31 23:10:38', '2026-08-31 23:10:38'),
(35, 'App\\Models\\User', 11, 'auth_token', '2cbba8b41b4130c7c4a291dd002e65a135273b75441b54cb769d70adb265e04b', '[\"*\"]', NULL, NULL, '2026-08-31 23:10:59', '2026-08-31 23:10:59'),
(36, 'App\\Models\\User', 9, 'auth_token', 'c3324cf9ad0e436090de2f20f8ef2217b13e223720ac7631ecc575ab921b89cb', '[\"*\"]', NULL, NULL, '2026-08-31 23:18:11', '2026-08-31 23:18:11'),
(37, 'App\\Models\\User', 1, 'auth_token', 'd63b45eaf87ed4a9f1f3a7150410c7bc7059bd4338d6c56b17e482ef8192de70', '[\"*\"]', NULL, NULL, '2026-09-01 05:00:34', '2026-09-01 05:00:34'),
(38, 'App\\Models\\User', 1, 'auth_token', '088bfa72dceb4f333631ad6bc7da869d4662667a21695cc176d6c2ee1b4c556b', '[\"*\"]', NULL, NULL, '2026-09-03 02:46:00', '2026-09-03 02:46:00'),
(39, 'App\\Models\\User', 9, 'auth_token', '24ce5111e6556637d23396b071d2ec440922614e0ff6dcdcb1df372b687a6658', '[\"*\"]', NULL, NULL, '2026-09-03 03:53:17', '2026-09-03 03:53:17'),
(40, 'App\\Models\\User', 9, 'auth_token', '6bdc767ed73903f6731c8ae550029edaaf9b840293e528b4b05598d9456b64b3', '[\"*\"]', NULL, NULL, '2026-09-03 17:43:45', '2026-09-03 17:43:45'),
(41, 'App\\Models\\User', 1, 'auth_token', 'fc461614fa1abb5d03420da2130459cc06316a54decc158cb20f88f5cd26e6c8', '[\"*\"]', NULL, NULL, '2026-09-03 18:09:49', '2026-09-03 18:09:49'),
(42, 'App\\Models\\User', 1, 'auth_token', '295d37cc4308689dcc3f5c9bd28d81450dbe51107a4e0611665f40de36cd660c', '[\"*\"]', NULL, NULL, '2026-09-03 18:14:54', '2026-09-03 18:14:54'),
(43, 'App\\Models\\User', 1, 'auth_token', '0e06508971d37b85f9735bdef5dd0f65d841e11259f5b121aef4b140abe42b46', '[\"*\"]', NULL, NULL, '2026-09-03 18:41:05', '2026-09-03 18:41:05'),
(44, 'App\\Models\\User', 9, 'auth_token', 'c2e2f5dfb9cf72d43c320f99ae226ce1618551b6d5f245507d2cb9ae9f83a772', '[\"*\"]', NULL, NULL, '2026-09-03 19:36:14', '2026-09-03 19:36:14'),
(45, 'App\\Models\\User', 1, 'auth_token', 'f7ed6f3b64acd6327365c99c0c5a20245a6c536b5f826a6f1b68c792bc15a6c4', '[\"*\"]', NULL, NULL, '2026-09-03 19:37:07', '2026-09-03 19:37:07'),
(46, 'App\\Models\\User', 1, 'auth_token', '4bd03bdc0173670b995dd67ec4ebd4e17bfc8a21a30d67ba3d6be12be6c2e935', '[\"*\"]', NULL, NULL, '2026-09-03 19:52:37', '2026-09-03 19:52:37'),
(47, 'App\\Models\\User', 9, 'auth_token', '15d4fe733bea3a7903a9d77853a6ceff3eb2215ad1788265865ab62b1c26a3d2', '[\"*\"]', NULL, NULL, '2026-09-03 19:54:24', '2026-09-03 19:54:24'),
(48, 'App\\Models\\User', 9, 'auth_token', '62bcb11356a1a867394e585825267314f05ff1876cc5a7d636c89a5afeca2250', '[\"*\"]', NULL, NULL, '2026-09-04 18:52:19', '2026-09-04 18:52:19'),
(49, 'App\\Models\\User', 1, 'auth_token', 'd5cceb8d73a37bcd50452575cdf7388aab843cb9efd362291e764db060568014', '[\"*\"]', NULL, NULL, '2026-09-04 18:52:43', '2026-09-04 18:52:43'),
(50, 'App\\Models\\User', 1, 'auth_token', 'a247d7f1f2810268a0d30039112b924e3e32904f29aefa8221690adbe0d2600f', '[\"*\"]', NULL, NULL, '2026-09-04 21:12:16', '2026-09-04 21:12:16'),
(51, 'App\\Models\\User', 9, 'auth_token', 'd91f6e3706a523c4dfaa07e0e8732e0a3848d6944bbcad6049a7290e3870cd99', '[\"*\"]', NULL, NULL, '2026-09-04 21:14:32', '2026-09-04 21:14:32'),
(52, 'App\\Models\\User', 9, 'auth_token', '8d9b5b785d0d27b9559b95d187719f5c8297f59fbaf644d8dd19cd73f23df4f7', '[\"*\"]', NULL, NULL, '2026-09-04 22:15:16', '2026-09-04 22:15:16'),
(53, 'App\\Models\\User', 9, 'auth_token', '076329e6c9ca545cb58055d211265e89b1d1458bea78eb3196fdba654178f43e', '[\"*\"]', NULL, NULL, '2026-09-05 04:37:05', '2026-09-05 04:37:05'),
(54, 'App\\Models\\User', 1, 'auth_token', 'f20b6fbe20edcccb75570b9f7e1848a62a4308a76ab3c3e8006a61b6f38aee65', '[\"*\"]', NULL, NULL, '2026-09-05 04:39:59', '2026-09-05 04:39:59'),
(57, 'App\\Models\\User', 9, 'auth_token', '64d7532538c844466efd0abbf58ef35b75944c3999403e2d118a41de362ae1f0', '[\"*\"]', '2026-09-05 05:59:59', NULL, '2026-09-05 05:58:29', '2026-09-05 05:59:59'),
(58, 'App\\Models\\User', 12, 'auth_token', '15af56c07d2145270b0c6107b0862d60ce189943fcd5ffc16077b70a00bf3760', '[\"*\"]', NULL, NULL, '2026-09-06 00:20:08', '2026-09-06 00:20:08'),
(63, 'App\\Models\\User', 8, 'auth_token', 'a5698aaf6c0159332290254308c9a4cf0164608e22e51d8732c69712fd840fe6', '[\"*\"]', '2026-09-06 02:58:40', NULL, '2026-09-06 02:53:32', '2026-09-06 02:58:40'),
(69, 'App\\Models\\User', 9, 'auth_token', '6a05a978e4b21d93f48ef45c0211469a2a3ad7b1cfc883756b7783a40559e8bb', '[\"*\"]', '2026-09-07 04:27:43', NULL, '2026-09-07 03:46:51', '2026-09-07 04:27:43'),
(70, 'App\\Models\\User', 9, 'auth_token', '74ad7ec54c3c4bbe786eee7c68a0dc21658eba844948a9cd6a576c52d8329f05', '[\"*\"]', '2026-09-07 04:18:13', NULL, '2026-09-07 04:18:05', '2026-09-07 04:18:13'),
(93, 'App\\Models\\User', 9, 'auth_token', '0c50da14812b13b3e158735caaeba53cea6e021127ef5f1b11950f8b1fb1823d', '[\"*\"]', '2026-09-08 05:42:18', NULL, '2026-09-08 04:42:39', '2026-09-08 05:42:18'),
(98, 'App\\Models\\User', 9, 'auth_token', '133cb65201a025946279c1fcf5b48dbb789902af3d2b32ffc7d9ca097e88c30b', '[\"*\"]', '2026-09-20 03:13:29', NULL, '2026-09-20 02:08:27', '2026-09-20 03:13:29');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_kategori`
--

CREATE TABLE `tbl_kategori` (
  `id_kategori` bigint NOT NULL,
  `nama_kategori` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_kategori`
--

INSERT INTO `tbl_kategori` (`id_kategori`, `nama_kategori`, `slug`, `created_at`, `updated_at`) VALUES
(1, 'Alat Tulis', 'alat-tulis', '2026-08-04 00:37:50', '2026-09-20 02:15:18'),
(2, 'Buku & Notebook', 'buku-notebook', '2026-08-04 00:37:50', '2026-09-20 02:15:35'),
(7, 'Pensil Warna', 'pensil-warna', '2026-08-10 03:06:09', '2026-08-17 02:38:46'),
(17, 'Highlighter & Marker', 'highlighter-marker', '2026-08-17 02:38:19', '2026-09-20 02:16:30'),
(18, 'Buku Kampus', 'buku-kampus', '2026-09-05 05:21:55', '2026-09-05 05:21:55'),
(19, 'Set Stationery', 'set-stationery', '2026-09-10 18:01:03', '2026-09-10 18:01:03'),
(20, 'Kerajinan DIY', 'kerajinan-diy', '2026-09-20 02:14:31', '2026-09-20 02:14:31'),
(21, 'Planner & Journal', 'planner-journal', '2026-09-20 02:15:56', '2026-09-20 02:15:56'),
(22, 'Pena & Pensil', 'pena-pensil', '2026-09-20 02:16:12', '2026-09-20 02:16:12'),
(23, 'Kertas & Memo', 'kertas-memo', '2026-09-20 02:16:42', '2026-09-20 02:16:42'),
(24, 'Perlengkapan Sekolah', 'perlengkapan-sekolah', '2026-09-20 02:16:52', '2026-09-20 02:16:52'),
(25, 'Perlengkapan Kantor', 'perlengkapan-kantor', '2026-09-20 02:17:04', '2026-09-20 02:17:04'),
(26, 'Dekorasi & Aksesori', 'dekorasi-aksesori', '2026-09-20 02:17:30', '2026-09-20 02:17:30');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_pesanan`
--

CREATE TABLE `tbl_pesanan` (
  `id_pesanan` bigint NOT NULL,
  `kode_transaksi` varchar(50) NOT NULL,
  `id_user` bigint NOT NULL,
  `tanggal_transaksi` datetime NOT NULL,
  `total_harga` bigint NOT NULL,
  `status_pembayaran` varchar(30) NOT NULL DEFAULT 'pending',
  `metode_pembayaran` varchar(30) DEFAULT NULL,
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `tanggal_pembayaran` timestamp NULL DEFAULT NULL,
  `alasan_penolakan` text,
  `status_pengiriman` enum('dikemas','dikirim','selesai','dibatalkan') DEFAULT 'dikemas',
  `catatan` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_pesanan`
--

INSERT INTO `tbl_pesanan` (`id_pesanan`, `kode_transaksi`, `id_user`, `tanggal_transaksi`, `total_harga`, `status_pembayaran`, `metode_pembayaran`, `bukti_pembayaran`, `tanggal_pembayaran`, `alasan_penolakan`, `status_pengiriman`, `catatan`, `created_at`, `updated_at`) VALUES
(1, 'TRX-20260810125706-VTIB', 1, '2026-08-10 12:57:06', 50000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', 'Pesanan dari website', '2026-08-10 05:57:06', '2026-08-14 21:28:10'),
(2, 'TRX-20260810132457-MQ0S', 1, '2026-08-10 13:24:57', 50000, 'pending', NULL, NULL, NULL, NULL, 'dikemas', 'Pesanan percobaan', '2026-08-10 06:24:57', '2026-08-10 06:24:58'),
(3, 'TRX-20260811044436-NDZX', 1, '2026-08-11 04:44:36', 50000, 'pending', NULL, NULL, NULL, NULL, 'dikemas', 'Tolong dikemas dengan baik', '2026-08-10 21:44:36', '2026-08-10 21:44:36'),
(4, 'TRX-20260811044634-TX88', 1, '2026-08-11 04:46:34', 50000, 'pending', NULL, NULL, NULL, NULL, 'dikemas', 'Pesanan saya', '2026-08-10 21:46:34', '2026-08-10 21:46:34'),
(5, 'TRX-20260815041603-04XZ', 1, '2026-08-15 04:16:03', 50000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', NULL, '2026-08-14 21:16:03', '2026-08-14 21:25:35'),
(6, 'TRX-20260815044323-HDCN', 1, '2026-08-15 04:43:23', 25000, 'lunas', NULL, NULL, NULL, NULL, 'selesai', 'Bungkus baik-baik yaa', '2026-08-14 21:43:23', '2026-08-14 21:44:37'),
(7, 'TRX-20260815050046-BNZH', 1, '2026-08-15 05:00:46', 30000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', 'aku mau bungkus pake kertas kado', '2026-08-14 22:00:46', '2026-08-14 22:10:44'),
(8, 'TRX-20260815051129-GVWE', 1, '2026-08-15 05:11:29', 52000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', NULL, '2026-08-14 22:11:29', '2026-08-14 22:18:16'),
(9, 'TRX-20260815051959-DTEX', 1, '2026-08-15 05:19:59', 30000, 'lunas', NULL, NULL, NULL, NULL, 'selesai', NULL, '2026-08-14 22:19:59', '2026-08-14 22:20:13'),
(10, 'TRX-20260815052104-YRI3', 1, '2026-08-15 05:21:04', 15000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', NULL, '2026-08-14 22:21:04', '2026-08-14 22:21:21'),
(11, 'TRX-20260815060631-WKJD', 7, '2026-08-15 06:06:31', 25000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', NULL, '2026-08-14 23:06:31', '2026-08-14 23:07:03'),
(12, 'TRX-20260815061035-S2LM', 8, '2026-08-15 06:10:35', 75000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', 'Aku mau bungkus kado untuk produk ini', '2026-08-14 23:10:35', '2026-08-16 02:30:59'),
(13, 'TRX-20260816094034-8GEK', 8, '2026-08-16 09:40:34', 125000, 'lunas', NULL, NULL, NULL, NULL, 'selesai', 'aku mau pesanan ini aman sampai ke rumah ku', '2026-08-16 02:40:34', '2026-08-16 04:25:47'),
(14, 'TRX-20260816104554-VT77', 1, '2026-08-16 10:45:54', 25000, 'pending', NULL, NULL, NULL, NULL, 'dikemas', NULL, '2026-08-16 03:45:54', '2026-08-16 03:45:54'),
(15, 'TRX-20260816105119-HPY2', 1, '2026-08-16 10:51:19', 25000, 'lunas', NULL, NULL, NULL, NULL, 'selesai', NULL, '2026-08-16 03:51:19', '2026-08-16 04:25:29'),
(16, 'TRX-20260817092956-0NUF', 8, '2026-08-17 09:29:56', 2000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', NULL, '2026-08-17 02:29:56', '2026-08-17 02:42:46'),
(17, 'TRX-20260827132404-YCYZ', 8, '2026-08-27 13:24:04', 25000, 'lunas', NULL, NULL, '2026-09-07 06:49:30', NULL, 'dikemas', NULL, '2026-08-27 06:24:04', '2026-09-07 06:49:30'),
(18, 'TRX-20260828023040-VYZ5', 10, '2026-08-28 02:30:40', 27000, 'lunas', NULL, NULL, NULL, NULL, 'selesai', NULL, '2026-08-27 19:30:40', '2026-08-27 19:32:37'),
(19, 'TRX-20260901061212-6N33', 11, '2026-09-01 06:12:12', 7000, 'gagal', NULL, NULL, NULL, NULL, 'dibatalkan', 'DIBAYARIN SAMA TIFA', '2026-08-31 23:12:12', '2026-09-01 04:59:01'),
(20, 'TRX-20260901061609-NBGI', 11, '2026-09-01 06:16:09', 40000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', 'DIBAYAR SM TIFA JUGAA', '2026-08-31 23:16:09', '2026-08-31 23:19:04'),
(21, 'TRX-20260904011023-QA8M', 1, '2026-09-04 01:10:23', 5000, 'gagal', NULL, NULL, NULL, NULL, 'dikemas', NULL, '2026-09-03 18:10:23', '2026-09-05 05:22:59'),
(22, 'TRX-20260904025317-48GT', 1, '2026-09-04 02:53:17', 25000, 'lunas', NULL, NULL, NULL, NULL, 'dikirim', NULL, '2026-09-03 19:53:17', '2026-09-03 19:54:52'),
(23, 'TRX-20260905114152-Y65C', 1, '2026-09-05 11:41:52', 15000, 'lunas', 'cod', NULL, NULL, NULL, 'dikemas', NULL, '2026-09-05 04:41:52', '2026-09-05 05:22:22'),
(24, 'TRX-20260905125715-0OM8', 8, '2026-09-05 12:57:15', 15000, 'lunas', 'ewallet', 'bukti_pembayaran/26XNsFI0eXjcCdkyO5NZxGKunpM2XmhviUJLTg2q.png', '2026-09-05 05:57:46', NULL, 'selesai', NULL, '2026-09-05 05:57:15', '2026-09-05 05:59:58'),
(25, 'TRX-20260906072438-J1JK', 12, '2026-09-06 07:24:38', 5000, 'lunas', 'transfer_bank', 'bukti_pembayaran/4l6o7mFpbpUNPER3MxF1Xhh4eJASwwywrrFSllbL.png', '2026-09-06 00:25:10', NULL, 'dikirim', 'ga ada', '2026-09-06 00:24:38', '2026-09-06 00:32:47'),
(26, 'TRX-20260907044137-JVRM', 1, '2026-09-07 04:41:37', 15000, 'lunas', 'ewallet', 'bukti_pembayaran/YA2DcsdAfHF0rP2OJTd8EzqaUyI0ABzlCAqgs7mK.png', '2026-09-06 21:41:56', NULL, 'dikirim', NULL, '2026-09-06 21:41:37', '2026-09-06 21:43:30'),
(27, 'TRX-20260907134610-8C81', 12, '2026-09-07 13:46:10', 32000, 'lunas', 'transfer_bank', 'bukti_pembayaran/nDHN5ndqJXz4293t1TUjtDkWWjyuTL9SCPmWXZuI.png', '2026-09-07 06:47:10', NULL, 'dikirim', 'aku mau tambahin pake bungkus kado', '2026-09-07 06:46:10', '2026-09-07 06:50:00'),
(28, 'TRX-20260908072132-GHH6', 8, '2026-09-08 07:21:32', 25000, 'lunas', 'transfer_bank', 'bukti_pembayaran/XdipSoaItMHpoj3fRKbGcPp0p5ChX6552QdDn53i.jpg', '2026-09-08 00:34:44', NULL, 'dikemas', NULL, '2026-09-08 00:21:32', '2026-09-08 00:37:11'),
(29, 'TRX-20260908112704-IBOP', 8, '2026-09-08 11:27:04', 25000, 'gagal', 'transfer_bank', NULL, '2026-09-08 04:39:28', 'tidak ada foto atau bukti', 'dikemas', NULL, '2026-09-08 04:27:04', '2026-09-08 04:41:24'),
(30, 'TRX-20260908114210-AE7M', 8, '2026-09-08 11:42:10', 25000, 'lunas', 'transfer_bank', 'bukti_pembayaran/N9YCFkzc0SUtybt1fewyZbgmhV7PEAImVn927Fpm.jpg', '2026-09-08 04:42:19', NULL, 'dikemas', NULL, '2026-09-08 04:42:10', '2026-09-08 04:43:15'),
(31, 'TRX-20260911011808-QHQO', 12, '2026-09-11 01:18:08', 28000, 'pending', 'cod', NULL, NULL, NULL, 'dikemas', NULL, '2026-09-10 18:18:08', '2026-09-10 18:18:08');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_pesanan_detail`
--

CREATE TABLE `tbl_pesanan_detail` (
  `id_detail` bigint NOT NULL,
  `id_pesanan` bigint NOT NULL,
  `id_produk` bigint NOT NULL,
  `jumlah` int NOT NULL,
  `harga_satuan` bigint NOT NULL,
  `subtotal` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_pesanan_detail`
--

INSERT INTO `tbl_pesanan_detail` (`id_detail`, `id_pesanan`, `id_produk`, `jumlah`, `harga_satuan`, `subtotal`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 2, 25000, 50000, '2026-08-10 05:57:06', '2026-08-10 05:57:06'),
(2, 2, 1, 2, 25000, 50000, '2026-08-10 06:24:57', '2026-08-10 06:24:57'),
(3, 3, 1, 2, 25000, 50000, '2026-08-10 21:44:36', '2026-08-10 21:44:36'),
(4, 4, 1, 2, 25000, 50000, '2026-08-10 21:46:34', '2026-08-10 21:46:34'),
(5, 5, 1, 2, 25000, 50000, '2026-08-14 21:16:03', '2026-08-14 21:16:03'),
(6, 6, 9, 1, 25000, 25000, '2026-08-14 21:43:23', '2026-08-14 21:43:23'),
(8, 8, 1, 1, 25000, 25000, '2026-08-14 22:11:29', '2026-08-14 22:11:29'),
(9, 8, 9, 1, 25000, 25000, '2026-08-14 22:11:29', '2026-08-14 22:11:29'),
(10, 8, 11, 1, 2000, 2000, '2026-08-14 22:11:29', '2026-08-14 22:11:29'),
(11, 9, 9, 1, 25000, 25000, '2026-08-14 22:19:59', '2026-08-14 22:19:59'),
(14, 11, 1, 1, 25000, 25000, '2026-08-14 23:06:31', '2026-08-14 23:06:31'),
(15, 12, 1, 3, 25000, 75000, '2026-08-14 23:10:35', '2026-08-14 23:10:35'),
(16, 13, 1, 5, 25000, 125000, '2026-08-16 02:40:34', '2026-08-16 02:40:34'),
(17, 14, 9, 1, 25000, 25000, '2026-08-16 03:45:54', '2026-08-16 03:45:54'),
(18, 15, 9, 1, 25000, 25000, '2026-08-16 03:51:19', '2026-08-16 03:51:19'),
(19, 16, 11, 1, 2000, 2000, '2026-08-17 02:29:56', '2026-08-17 02:29:56'),
(20, 17, 9, 1, 25000, 25000, '2026-08-27 06:24:04', '2026-08-27 06:24:04'),
(21, 18, 9, 1, 25000, 25000, '2026-08-27 19:30:40', '2026-08-27 19:30:40'),
(22, 18, 11, 1, 2000, 2000, '2026-08-27 19:30:41', '2026-08-27 19:30:41'),
(24, 19, 11, 1, 2000, 2000, '2026-08-31 23:12:12', '2026-08-31 23:12:12'),
(25, 20, 9, 1, 25000, 25000, '2026-08-31 23:16:09', '2026-08-31 23:16:09'),
(26, 20, 14, 1, 15000, 15000, '2026-08-31 23:16:09', '2026-08-31 23:16:09'),
(27, 21, 11, 1, 2000, 2000, '2026-09-03 18:10:23', '2026-09-03 18:10:23'),
(29, 22, 9, 1, 25000, 25000, '2026-09-03 19:53:17', '2026-09-03 19:53:17'),
(30, 23, 14, 1, 15000, 15000, '2026-09-05 04:41:52', '2026-09-05 04:41:52'),
(31, 24, 14, 1, 15000, 15000, '2026-09-05 05:57:15', '2026-09-05 05:57:15'),
(33, 26, 14, 1, 15000, 15000, '2026-09-06 21:41:37', '2026-09-06 21:41:37'),
(34, 27, 17, 1, 10000, 10000, '2026-09-07 06:46:10', '2026-09-07 06:46:10'),
(35, 27, 19, 1, 22000, 22000, '2026-09-07 06:46:10', '2026-09-07 06:46:10'),
(36, 28, 9, 1, 25000, 25000, '2026-09-08 00:21:32', '2026-09-08 00:21:32'),
(37, 29, 9, 1, 25000, 25000, '2026-09-08 04:27:04', '2026-09-08 04:27:04'),
(38, 30, 9, 1, 25000, 25000, '2026-09-08 04:42:10', '2026-09-08 04:42:10'),
(39, 31, 20, 1, 28000, 28000, '2026-09-10 18:18:08', '2026-09-10 18:18:08');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_produk`
--

CREATE TABLE `tbl_produk` (
  `id_produk` bigint NOT NULL,
  `id_kategori` bigint DEFAULT NULL,
  `nama_produk` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `harga` bigint NOT NULL,
  `stok` int NOT NULL DEFAULT '0',
  `deskripsi` text,
  `foto_produk` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_produk`
--

INSERT INTO `tbl_produk` (`id_produk`, `id_kategori`, `nama_produk`, `slug`, `harga`, `stok`, `deskripsi`, `foto_produk`, `created_at`, `updated_at`) VALUES
(1, 2, 'Notebook Pink Aesthetic', 'notebook-pink-aesthetic', 25000, 20, 'Notebook lucu untuk journaling', 'products/Rw4cOsKP3aThMpr3eKviqKRU9CDrjlQj8Qleq88I.jpg', '2026-08-04 00:37:50', '2026-09-20 02:35:41'),
(9, 2, 'Notebook Merah Aesthetic', 'notebook-merah-aesthetic', 25000, 9, '`Notebook lucu untuk journaling', 'products/pBirD89hQeA1o7KMhDte8OwSH4VHf0nFkPC5LQgV.jpg', '2026-08-10 04:01:58', '2026-09-20 02:35:55'),
(11, 22, 'Pensil Kucing', 'pensil-kucing', 2000, 46, 'Pensil kucing mekanik 2B.', 'products/xuVs6pN3QqyX2t9Gis04TYC9QBBorKtGodgDo98I.jpg', '2026-08-10 05:22:11', '2026-09-20 02:26:59'),
(14, 17, 'Spidol Shands Pastel', 'spidol-shands-pastel', 15000, 0, 'Set 12pcs', 'products/VsF45sA6Kq4oIbsieenzyGDXykvoltIOIGAlONhb.jpg', '2026-08-17 02:41:35', '2026-09-10 18:15:54'),
(17, 1, 'Pulpen satu set', 'pulpen-satu-set', 10000, 46, 'pulpen 0.5', 'products/XzT7TGlHEU9hXmdmsOSrsMdq1Pa2RE0h43GzxJO2.jpg', '2026-09-07 05:42:02', '2026-09-07 06:46:10'),
(19, 23, 'Sticky Memo Pastel', 'sticky-memo-pastel', 22000, 24, 'kertas', 'products/vzPUZjwdU6sQsy0MeK09y4KKRglx5p37XPNsHpi1.jpg', '2026-09-07 06:40:56', '2026-09-20 02:57:32'),
(20, 19, 'Set Stationery Pink', 'set-stationery-pink', 28000, 29, 'Sticky Note, Pulpen, Penghapus dan Correction Tape', 'products/5WdEPBQOX5BkhFu7EBxa6Tsurv8RM0O3txrTPYAU.jpg', '2026-09-10 18:04:36', '2026-09-10 18:18:08'),
(21, 21, 'Daily Planner Pastel', 'daily-planner-pastel', 22000, 16, 'Planner Daily', 'products/vtIwWQ94m1P9KHSGzrqeSBUbJd24fuN6qDb1pBCj.jpg', '2026-09-20 02:25:54', '2026-09-20 02:25:54'),
(22, 22, 'Gel Pen Set 6 Warna', 'gel-pen-set-6-warna', 20000, 20, '6 Pcs Pena Pulpen Tinta Hitam', 'products/7rUpckcqMCIY0Ke7wBpnoNzcGDJ8KIjhSEHx1ZKE.jpg', '2026-09-20 02:40:40', '2026-09-20 02:40:40'),
(23, 17, 'Mild Highlighter Set', 'mild-highlighter-set', 56000, 9, 'Zebra Mildliner Calm Gentle Natural Mild Colors Double Sided Highlighter Penanda Halaman New Colors 5 warna baru Zebra Mildliner! Dijual dalam 1 set.', 'products/ykA17AVjvdtfu3R7WkJaST5yFb7vqqWSq0hFP1TZ.jpg', '2026-09-20 02:49:32', '2026-09-20 02:49:32'),
(24, 20, 'DIY Paper Kit', 'diy-paper-kit', 18000, 35, 'Journal Starter Kit', 'products/UBn2nggIuAbYhPojWGX67RLoAB4UbNU8fqjwSPaQ.jpg', '2026-09-20 03:13:30', '2026-09-20 03:13:30');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` bigint NOT NULL,
  `nama` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','customer') DEFAULT 'customer',
  `no_telepon` varchar(20) DEFAULT NULL,
  `alamat` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id_user`, `nama`, `email`, `password`, `role`, `no_telepon`, `alamat`, `created_at`, `updated_at`) VALUES
(1, 'Marva', 'marva@gmail.com', '$2y$12$gs1R.rU6iZl8HJdSY0siJOgHG301PI4d1EeL5vyIL.18cPkcNR23a', 'customer', '08123456789', 'Gg. garu 7 no 12a', '2026-08-03 23:25:42', '2026-09-06 03:55:06'),
(3, 'Customer Cantik', 'customer@craft.com', '$2y$12$GeemOOtoubHDmUqBeS/xQeh1p9y4QKdz2w08IaFbnUySfFeAcVxP2', 'customer', '089876543210', 'Jl. Mawar Pastel No. 12', '2026-08-04 00:37:49', '2026-08-04 00:37:49'),
(5, 'Customer Test', 'customer@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC3f8Wm4L6j7c7zF5wS', 'customer', '081234567890', 'Bandung', '2026-08-11 07:18:10', '2026-08-11 07:18:10'),
(6, 'Marva Aulia', 'marvaaulia@gmail.com', '$2y$12$cz2DnKLtIQjN8K.KF7O7XOfhpvj/0lx1nhlKs3RTYrC8f2An6pdRC', 'customer', '08123456789', 'Bandung', '2026-08-13 19:41:26', '2026-08-13 19:41:26'),
(7, 'Sakuya', 'sakuya@gmail.com', '$2y$12$/lTiCcmAsI3gnR.6POVLHOwUcoTTqMYXSf4LIGe3UNFqwv9LaE.SW', 'customer', '08976532433', 'jl. nctwish', '2026-08-14 22:46:27', '2026-08-14 22:46:27'),
(8, 'Tes', 'ohyul@gmail.com', '$2y$12$mJ1V4/KsU1.6MgqGlpnPnOQjrdN2eEAdAa7iw4XFxA/yCEYD8O/62', 'customer', '089763222556', 'Jl. LNGST4SHO', '2026-08-14 23:09:42', '2026-09-06 02:56:59'),
(9, 'Admin Craft Studio', 'admin@gmail.com', '$2y$12$dxfB75.JDeiBdoNJmmUkw.z3kE/KYK8Je3nrqIIo9Bheh.1HqiK6i', 'admin', '081234567890', 'Bandung', '2026-08-16 04:21:46', '2026-08-16 04:21:46'),
(10, 'rai', 'raii@gmail.com', '$2y$12$Pk1VymY5N1U0FeK5LEjmwuFpEi/lE8a5YR0xJc0pSbVXSlBkOMKR6', 'customer', '0881023330365', 'ekek', '2026-08-27 19:29:45', '2026-08-27 19:29:45'),
(11, 'aliya', 'aal@gmail.com', '$2y$12$Zk6P8FdQ9tglHA2vVMELAuk7QkRnXju9IUNwmTWaegdVFSisCf1p2', 'customer', '08810225560', 'kawaluyaan', '2026-08-31 23:10:35', '2026-08-31 23:10:35'),
(12, 'woojin', 'woojin@gmail.com', '$2y$12$xxQ5apngHRZD9dvM67C5p.q3PnWQpR3fNKx5k/dUEb0oUtopPfB86', 'customer', '081112345678', 'Jl. Babakan Sari no 12a', '2026-09-06 00:20:08', '2026-09-06 00:20:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `tbl_kategori`
--
ALTER TABLE `tbl_kategori`
  ADD PRIMARY KEY (`id_kategori`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `tbl_pesanan`
--
ALTER TABLE `tbl_pesanan`
  ADD PRIMARY KEY (`id_pesanan`),
  ADD UNIQUE KEY `kode_transaksi` (`kode_transaksi`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `tbl_pesanan_detail`
--
ALTER TABLE `tbl_pesanan_detail`
  ADD PRIMARY KEY (`id_detail`),
  ADD KEY `id_pesanan` (`id_pesanan`),
  ADD KEY `id_produk` (`id_produk`);

--
-- Indexes for table `tbl_produk`
--
ALTER TABLE `tbl_produk`
  ADD PRIMARY KEY (`id_produk`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `id_kategori` (`id_kategori`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `tbl_kategori`
--
ALTER TABLE `tbl_kategori`
  MODIFY `id_kategori` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `tbl_pesanan`
--
ALTER TABLE `tbl_pesanan`
  MODIFY `id_pesanan` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `tbl_pesanan_detail`
--
ALTER TABLE `tbl_pesanan_detail`
  MODIFY `id_detail` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `tbl_produk`
--
ALTER TABLE `tbl_produk`
  MODIFY `id_produk` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_pesanan`
--
ALTER TABLE `tbl_pesanan`
  ADD CONSTRAINT `tbl_pesanan_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_pesanan_detail`
--
ALTER TABLE `tbl_pesanan_detail`
  ADD CONSTRAINT `tbl_pesanan_detail_ibfk_1` FOREIGN KEY (`id_pesanan`) REFERENCES `tbl_pesanan` (`id_pesanan`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_pesanan_detail_ibfk_2` FOREIGN KEY (`id_produk`) REFERENCES `tbl_produk` (`id_produk`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_produk`
--
ALTER TABLE `tbl_produk`
  ADD CONSTRAINT `tbl_produk_ibfk_1` FOREIGN KEY (`id_kategori`) REFERENCES `tbl_kategori` (`id_kategori`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
