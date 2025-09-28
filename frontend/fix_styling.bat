@echo off
echo 🎨 Fixing styling issues...

echo 🧹 Cleaning cache...
rmdir /s /q .next 2>nul

echo 📦 Installing missing dependencies...
npm install rimraf tailwindcss-animate

echo 🔧 Rebuilding Tailwind CSS...
npx tailwindcss -i ./src/app/globals.css -o ./src/app/output.css --watch=false

echo 🚀 Restarting development server...
npm run dev

echo ✅ Styling should be fixed now!
pause
