<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Studio Craft</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style> body { font-family: 'Poppins', sans-serif; } </style>
</head>
<body class="bg-pastel-cream text-pastel-dark min-h-screen flex items-center justify-center p-4">

    <div class="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-sm border border-white w-full max-w-md">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-semibold mb-2">✨ Welcome Back!</h1>
            <p class="text-gray-500 text-sm">Masuk ke akun Studio Craft kamu</p>
        </div>

        @if ($errors->any())
            <div class="bg-red-100 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">
                {{ $errors->first() }}
            </div>
        @endif

        <form action="/login" method="POST" class="space-y-5">
            @csrf
            <div>
                <label class="block text-sm font-medium mb-1">Email</label>
                <input type="email" name="email" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pastel-pink bg-gray-50" placeholder="admin@craft.com">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1">Password</label>
                <input type="password" name="password" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pastel-pink bg-gray-50" placeholder="••••••••">
            </div>

            <button type="submit" class="w-full bg-pastel-pink text-pastel-dark font-semibold py-3 rounded-xl hover:bg-pink-200 transition shadow-sm">
                Masuk Sekarang
            </button>
        </form>
        
        <p class="text-center text-sm text-gray-400 mt-6">
            <a href="/" class="hover:text-pastel-pink transition">← Kembali ke Katalog</a>
        </p>
    </div>

</body>
</html>