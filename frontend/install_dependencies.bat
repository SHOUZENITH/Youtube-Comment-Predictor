@echo off
echo 🚀 Installing frontend dependencies...

echo 📦 Installing main dependencies...
npm install

echo 🎨 Installing UI dependencies...
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge tailwindcss-animate

echo 🔧 Installing lucide-react...
npm install lucide-react

echo ✅ All dependencies installed!
echo.
echo 📋 Next steps:
echo 1. Run: npm run dev
echo 2. Open: http://localhost:3000
echo.
pause
