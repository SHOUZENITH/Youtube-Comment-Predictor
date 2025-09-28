import os

def create_model_folders():
    """
    Membuat folder kosong untuk model lokal
    """
    
    # Buat folder models jika belum ada
    models_dir = "./models"
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        print(f"✅ Created directory: {models_dir}")
    
    # Buat folder model_emotion
    emotion_dir = "./models/model_emotion"
    if not os.path.exists(emotion_dir):
        os.makedirs(emotion_dir)
        print(f"✅ Created directory: {emotion_dir}")
    else:
        print(f"📁 Directory already exists: {emotion_dir}")
    
    # Buat folder model_sentiment  
    sentiment_dir = "./models/model_sentiment"
    if not os.path.exists(sentiment_dir):
        os.makedirs(sentiment_dir)
        print(f"✅ Created directory: {sentiment_dir}")
    else:
        print(f"📁 Directory already exists: {sentiment_dir}")
    
    # Buat folder model_predict (like count prediction)
    like_count_dir = "./models/model_predict"
    if not os.path.exists(like_count_dir):
        os.makedirs(like_count_dir)
        print(f"✅ Created directory: {like_count_dir}")
    else:
        print(f"📁 Directory already exists: {like_count_dir}")
    
    # Buat file README di setiap folder
    create_readme_files(emotion_dir, sentiment_dir, like_count_dir)
    
    print("\n🎉 Model folders created successfully!")
    print("\n📋 Next steps:")
    print("1. Copy your emotion model files to: ./models/model_emotion/")
    print("2. Copy your sentiment model files to: ./models/model_sentiment/")
    print("3. Copy your like count prediction model files to: ./models/model_predict/")
    print("\n📄 Required files in each folder:")
    print("   - config.json")
    print("   - pytorch_model.bin (or model.safetensors)")
    print("   - tokenizer.json") 
    print("   - tokenizer_config.json")
    print("   - vocab.txt (or equivalent tokenizer files)")

def create_readme_files(emotion_dir, sentiment_dir, like_count_dir):
    """
    Membuat file README di setiap folder model
    """
    
    emotion_readme = os.path.join(emotion_dir, "README.md")
    with open(emotion_readme, "w", encoding="utf-8") as f:
        f.write("""# Emotion Model

Folder ini untuk model klasifikasi emosi.

## File yang diperlukan:
- config.json
- pytorch_model.bin (atau model.safetensors)
- tokenizer.json
- tokenizer_config.json
- vocab.txt (atau file tokenizer lainnya)

## Label emosi yang didukung:
- joy (kegembiraan)
- sadness (kesedihan)
- anger (kemarahan)
- fear (ketakutan)
- disgust (jijik)
- surprise (terkejut)
- neutral (netral)

Silakan copy file model Anda ke folder ini.
""")
    
    sentiment_readme = os.path.join(sentiment_dir, "README.md")
    with open(sentiment_readme, "w", encoding="utf-8") as f:
        f.write("""# Sentiment Model

Folder ini untuk model klasifikasi sentimen.

## File yang diperlukan:
- config.json
- pytorch_model.bin (atau model.safetensors)
- tokenizer.json
- tokenizer_config.json
- vocab.txt (atau file tokenizer lainnya)

## Label sentimen yang didukung:
- positive (positif)
- negative (negatif)
- neutral (netral)

Silakan copy file model Anda ke folder ini.
""")
    
    like_count_readme = os.path.join(like_count_dir, "README.md")
    with open(like_count_readme, "w", encoding="utf-8") as f:
        f.write("""# Like Count Prediction Model

Folder ini untuk model prediksi jumlah like.

## File yang diperlukan:
- config.json
- pytorch_model.bin (atau model.safetensors)
- tokenizer.json
- tokenizer_config.json
- vocab.txt (atau file tokenizer lainnya)

## Label prediksi like count yang didukung:
- low (0-10 likes)
- medium (11-100 likes)
- high (101-1000 likes)
- viral (1000+ likes)

Silakan copy file model Anda ke folder ini.
""")

if __name__ == "__main__":
    create_model_folders()
