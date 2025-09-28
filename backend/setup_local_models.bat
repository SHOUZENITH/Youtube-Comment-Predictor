@echo off
echo 🚀 Setting up local models for YouTube Comment Analyzer...
echo.

echo 📁 Creating model directories...
python create_model_folders.py

echo.
echo 📋 Setup complete!
echo.
echo Next steps:
echo 1. Copy your emotion model files to: models/model_emotion/
echo 2. Copy your sentiment model files to: models/model_sentiment/
echo 3. Run: python app.py
echo.
pause
