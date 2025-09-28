@echo off
echo 🔄 Restarting development server...

echo 🧹 Clearing Next.js cache...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo 📦 Reinstalling dependencies...
npm install

echo 🚀 Starting development server...
npm run dev

pause
