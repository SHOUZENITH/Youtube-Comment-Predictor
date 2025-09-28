from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModel, AutoModelForSequenceClassification
import torch
import os
import json
import joblib
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Path ke model lokal
EMOTION_MODEL_PATH = "./models/model_emotion"
SENTIMENT_MODEL_PATH = "./models/model_sentiment"
LIKE_COUNT_MODEL_PATH = "./models/model_predict"
XGBOOST_MODEL_PATH = os.path.join(LIKE_COUNT_MODEL_PATH, "xgboost_BERT_embeddings.pkl")
HISTORY_FILE = "./history.json"

print("🔄 Loading local models...")

# Global variables untuk model
emotion_model, emotion_tokenizer = None, None
sentiment_model, sentiment_tokenizer = None, None
embedding_tokenizer, embedding_model = None, None
like_model = joblib.load(XGBOOST_MODEL_PATH)

# Detailed model loading with debugging
try:
    # Load Emotion model
    if os.path.exists(EMOTION_MODEL_PATH):
        emotion_model = AutoModelForSequenceClassification.from_pretrained(EMOTION_MODEL_PATH)
        emotion_tokenizer = AutoTokenizer.from_pretrained(EMOTION_MODEL_PATH)
        print("✅ Local emotion model loaded successfully")
    else:
        print(f"❌ Emotion model not found at {EMOTION_MODEL_PATH}")

    # Load Sentiment model
    if os.path.exists(SENTIMENT_MODEL_PATH):
        sentiment_model = AutoModelForSequenceClassification.from_pretrained(SENTIMENT_MODEL_PATH)
        sentiment_tokenizer = AutoTokenizer.from_pretrained(SENTIMENT_MODEL_PATH)
        print("✅ Local sentiment model loaded successfully")
    else:
        print(f"❌ Sentiment model not found at {SENTIMENT_MODEL_PATH}")

    # Load Like Count models with detailed debugging
    print(f"\n🔍 Checking like count model path: {LIKE_COUNT_MODEL_PATH}")
    print(f"📁 Directory exists: {os.path.exists(LIKE_COUNT_MODEL_PATH)}")
    
    if os.path.exists(LIKE_COUNT_MODEL_PATH):
        files_in_dir = os.listdir(LIKE_COUNT_MODEL_PATH)
        print(f"📄 Files in directory: {files_in_dir}")
        
        # Try to load BERT model
        try:
            embedding_tokenizer = AutoTokenizer.from_pretrained(LIKE_COUNT_MODEL_PATH)
            embedding_model = AutoModel.from_pretrained(LIKE_COUNT_MODEL_PATH)
            print("✅ BERT model for embeddings loaded successfully")
        except Exception as e:
            print(f"❌ Error loading BERT model: {e}")
            embedding_tokenizer, embedding_model = None, None
    else:
        print(f"❌ Like count model folder not found at {LIKE_COUNT_MODEL_PATH}")

    # Load XGBoost model
    print(f"\n🔍 Checking XGBoost model: {XGBOOST_MODEL_PATH}")
    print(f"📁 XGBoost file exists: {os.path.exists(XGBOOST_MODEL_PATH)}")
    
    if os.path.exists(XGBOOST_MODEL_PATH):
        try:
            like_model = joblib.load(XGBOOST_MODEL_PATH)
            print("✅ XGBoost model loaded successfully")
            print(f"📊 XGBoost model type: {type(like_model)}")
            print(f"📊 Has predict method: {hasattr(like_model, 'predict')}")
        except Exception as e:
            print(f"❌ Error loading XGBoost model: {e}")
            like_model = None
    else:
        print(f"❌ XGBoost .pkl model not found at {XGBOOST_MODEL_PATH}")

except Exception as e:
    print(f"❌ Failed to load models: {e}")

emotion_labels = {
    0: "joy",
    1: "sadness",
    2: "anger",
    3: "fear",
    4: "disgust",
    5: "surprise",
    6: "neutral"
}

sentiment_labels = {
    0: "positive",
    1: "negative",
    2: "neutral"
}

like_count_labels = {
    0: "low",
    1: "medium",
    2: "high",
    3: "viral"
}

def extract_bert_embedding(text):
    """Extract BERT embeddings from text with detailed debugging"""
    try:
        if not embedding_tokenizer or not embedding_model:
            print("❌ BERT model components not loaded")
            return None
            
        print(f"🔍 Extracting embedding for text: '{text[:50]}...'")
        
        # Tokenize input
        inputs = embedding_tokenizer(
            text, 
            return_tensors="pt", 
            truncation=True, 
            padding=True,
            max_length=512
        )
        
        print(f"📊 Tokenized input shape: {inputs['input_ids'].shape}")
        
        # Get embeddings
        with torch.no_grad():
            outputs = embedding_model(**inputs)
        
        # Use CLS token embedding (first token)
        pooled_output = outputs.last_hidden_state[:, 0, :].numpy()
        
        print(f"📊 Raw embedding shape: {pooled_output.shape}")
        print(f"📊 Embedding sample values: {pooled_output[0][:5]}")
        
        return pooled_output
        
    except Exception as e:
        print(f"❌ Error extracting BERT embedding: {e}")
        import traceback
        traceback.print_exc()
        return None

def predict_class(text, tokenizer, model):
    """Predict class using classification model"""
    try:
        if not tokenizer or not model:
            print("❌ Classification model components not loaded")
            return None
            
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            logits = model(**inputs).logits
        prediction = torch.argmax(logits, dim=1).item()
        print(f"📊 Classification prediction: {prediction}")
        return prediction
    except Exception as e:
        print(f"❌ Error in classification prediction: {e}")
        return None

def map_regression_to_class(regression_value):
    try:
        value = float(regression_value)
        print(f"📊 Mapping regression value: {value}")

        if value < 100:
            return 0  # low
        elif 100 <= value <= 500:
            return 1  # medium
        elif 501 <= value <= 1500:
            return 2  # high
        else:
            return 3  # viral
    except Exception as e:
        print(f"❌ Error mapping regression value: {e}")
        return None

def predict_like_count(text):
    """Predict like count using XGBoost regressor with proper mapping"""
    try:
        print(f"\n🔍 Starting like count prediction for: '{text[:50]}...'")
        
        if not like_model:
            print("❌ XGBoost model not loaded")
            return None
            
        if not embedding_tokenizer or not embedding_model:
            print("❌ BERT embedding model not loaded")
            return None
        
        # Extract BERT embeddings
        print("📊 Step 1: Extracting BERT embeddings...")
        features = extract_bert_embedding(text)
        if features is None:
            print("❌ Failed to extract features")
            return None
        
        print("📊 Step 2: Preparing features for XGBoost...")
        # Ensure features are in correct format
        if len(features.shape) > 1:
            features = features.flatten()
        
        # Reshape for single prediction
        features = features.reshape(1, -1)
        
        print(f"📊 Final features shape for XGBoost: {features.shape}")
        print(f"📊 Features dtype: {features.dtype}")
        print(f"📊 Features sample: {features[0][:5]}")
        
        # Make prediction
        print("📊 Step 3: Making XGBoost prediction...")
        prediction = like_model.predict(features)
        print(f"📊 XGBoost raw prediction: {prediction}")
        print(f"📊 Prediction type: {type(prediction)}")
        print(f"📊 Prediction shape: {prediction.shape if hasattr(prediction, 'shape') else 'No shape'}")
        
        if len(prediction) > 0:
            raw_value = prediction[0]
            print(f"📊 Raw regression value: {raw_value}")
            
            # Check if it's already a class index or needs mapping
            if isinstance(raw_value, (int, np.integer)) and 0 <= raw_value <= 3:
                # Already a class index
                pred_value = int(raw_value)
                print(f"📊 Using as class index: {pred_value}")
            else:
                # It's a regression value, map to class
                pred_value = map_regression_to_class(raw_value)
                print(f"📊 Mapped to class index: {pred_value}")
            
            if pred_value is not None:
                return pred_value
            else:
                print("❌ Failed to map regression value to class")
                return None
        else:
            print("❌ Empty prediction result")
            return None
        
    except Exception as e:
        print(f"❌ Error in like count prediction: {e}")
        import traceback
        traceback.print_exc()
        return None

def load_history():
    """Load history from JSON file"""
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error loading history: {e}")
        return []

def save_history(history):
    """Save history to JSON file"""
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving history: {e}")

def add_to_history(comment, emotion, sentiment, like_count):
    """Add new prediction to history"""
    history = load_history()
    new_entry = {
        "id": len(history) + 1,
        "timestamp": datetime.now().isoformat(),
        "comment": comment[:100] + "..." if len(comment) > 100 else comment,
        "full_comment": comment,
        "emotion": emotion,
        "sentiment": sentiment,
        "like_count": like_count
    }
    history.insert(0, new_entry)
    if len(history) > 50:
        history = history[:50]
    save_history(history)
    return new_entry

@app.route("/predict", methods=["POST"])
def predict_handler():
    """Handle prediction requests with detailed debugging"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
            
        text = data.get("text", "").strip()
        if not text:
            return jsonify({"error": "Text cannot be empty"}), 400

        print(f"\n🔍 ===== STARTING PREDICTION =====")
        print(f"📝 Input text: '{text}'")
        
        result = {}
        
        # Predict emotion
        print(f"\n📊 EMOTION PREDICTION")
        if emotion_model and emotion_tokenizer:
            emotion_pred = predict_class(text, emotion_tokenizer, emotion_model)
            if emotion_pred is not None:
                result["emotion"] = emotion_labels.get(emotion_pred, "unknown")
                print(f"😊 Emotion result: {result['emotion']}")
            else:
                result["emotion"] = "error"
                print(f"❌ Emotion prediction failed")
        else:
            result["emotion"] = "model_not_loaded"
            print(f"❌ Emotion model not loaded")

        # Predict sentiment
        print(f"\n📊 SENTIMENT PREDICTION")
        if sentiment_model and sentiment_tokenizer:
            sentiment_pred = predict_class(text, sentiment_tokenizer, sentiment_model)
            if sentiment_pred is not None:
                result["sentiment"] = sentiment_labels.get(sentiment_pred, "unknown")
                print(f"👍 Sentiment result: {result['sentiment']}")
            else:
                result["sentiment"] = "error"
                print(f"❌ Sentiment prediction failed")
        else:
            result["sentiment"] = "model_not_loaded"
            print(f"❌ Sentiment model not loaded")

        # Predict like count
        print(f"\n📊 LIKE COUNT PREDICTION")
        if like_model and embedding_tokenizer and embedding_model:
            like_pred = predict_like_count(text)
            if like_pred is not None:
                result["like_count"] = like_count_labels.get(like_pred, "unknown")
                print(f"🚀 Like count result: {result['like_count']}")
            else:
                result["like_count"] = "error"
                print(f"❌ Like count prediction failed")
        else:
            result["like_count"] = "model_not_loaded"
            print(f"❌ Like count models not loaded")
            print(f"   - XGBoost loaded: {like_model is not None}")
            print(f"   - BERT tokenizer loaded: {embedding_tokenizer is not None}")
            print(f"   - BERT model loaded: {embedding_model is not None}")

        # Add to history
        entry = add_to_history(
            text, 
            result.get("emotion", "unknown"), 
            result.get("sentiment", "unknown"), 
            result.get("like_count", "unknown")
        )
        result["history_id"] = entry["id"]
        result["status"] = "success"

        print(f"\n✅ ===== FINAL RESULT =====")
        print(f"📊 {result}")
        return jsonify(result)

    except Exception as e:
        print(f"❌ Error in prediction handler: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/test-like-count", methods=["POST"])
def test_like_count():
    """Test endpoint specifically for like count debugging"""
    try:
        data = request.get_json()
        text = data.get("text", "This is a test comment")
        
        print(f"\n🧪 TESTING LIKE COUNT PREDICTION")
        print(f"📝 Test text: '{text}'")
        
        # Check model availability
        models_available = {
            "xgboost_loaded": like_model is not None,
            "bert_tokenizer_loaded": embedding_tokenizer is not None,
            "bert_model_loaded": embedding_model is not None,
            "xgboost_path_exists": os.path.exists(XGBOOST_MODEL_PATH),
            "bert_path_exists": os.path.exists(LIKE_COUNT_MODEL_PATH),
            "xgboost_type": str(type(like_model)) if like_model else None
        }
        
        print(f"📊 Model status: {models_available}")
        
        if not all([like_model, embedding_tokenizer, embedding_model]):
            return jsonify({
                "error": "Models not loaded",
                "models_status": models_available,
                "xgboost_path": XGBOOST_MODEL_PATH,
                "bert_path": LIKE_COUNT_MODEL_PATH
            })
        
        # Test prediction
        prediction = predict_like_count(text)
        
        if prediction is not None:
            label = like_count_labels.get(prediction, "unknown")
            return jsonify({
                "success": True,
                "raw_prediction": int(prediction),
                "label": label,
                "models_status": models_available
            })
        else:
            return jsonify({
                "error": "Prediction failed",
                "models_status": models_available
            })
            
    except Exception as e:
        print(f"❌ Error in test endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)})

@app.route("/history", methods=["GET"])
def get_history():
    """Get prediction history"""
    try:
        history = load_history()
        return jsonify({
            "status": "success",
            "history": history,
            "total": len(history)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/history/<int:history_id>", methods=["DELETE"])
def delete_history_item(history_id):
    """Delete specific history item"""
    try:
        history = load_history()
        history = [item for item in history if item["id"] != history_id]
        save_history(history)
        return jsonify({"status": "success", "message": "History item deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/history/clear", methods=["DELETE"])
def clear_history():
    """Clear all history"""
    try:
        save_history([])
        return jsonify({"status": "success", "message": "History cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/stats", methods=["GET"])
def get_stats():
    """Get prediction statistics"""
    try:
        history = load_history()
        if not history:
            return jsonify({
                "status": "success",
                "stats": {
                    "total_predictions": 0,
                    "emotion_stats": {},
                    "sentiment_stats": {},
                    "like_count_stats": {}
                }
            })

        emotion_counts = {}
        sentiment_counts = {}
        like_count_counts = {}
        
        for item in history:
            emotion = item.get("emotion", "unknown")
            sentiment = item.get("sentiment", "unknown")
            like_count = item.get("like_count", "unknown")
            
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
            like_count_counts[like_count] = like_count_counts.get(like_count, 0) + 1

        return jsonify({
            "status": "success",
            "stats": {
                "total_predictions": len(history),
                "emotion_stats": emotion_counts,
                "sentiment_stats": sentiment_counts,
                "like_count_stats": like_count_counts
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Check model health status"""
    models_status = {
        "emotion_model": {
            "loaded": emotion_model is not None,
            "path": EMOTION_MODEL_PATH,
            "exists": os.path.exists(EMOTION_MODEL_PATH)
        },
        "sentiment_model": {
            "loaded": sentiment_model is not None,
            "path": SENTIMENT_MODEL_PATH,
            "exists": os.path.exists(SENTIMENT_MODEL_PATH)
        },
        "like_count_model": {
            "loaded": like_model is not None and embedding_model is not None,
            "path": LIKE_COUNT_MODEL_PATH,
            "exists": os.path.exists(LIKE_COUNT_MODEL_PATH),
            "xgboost_exists": os.path.exists(XGBOOST_MODEL_PATH),
            "bert_loaded": embedding_model is not None,
            "xgboost_loaded": like_model is not None,
            "xgboost_path": XGBOOST_MODEL_PATH,
            "xgboost_type": str(type(like_model)) if like_model else None
        }
    }
    
    all_loaded = (
        models_status["emotion_model"]["loaded"] and 
        models_status["sentiment_model"]["loaded"] and 
        models_status["like_count_model"]["loaded"]
    )
    
    return jsonify({
        "status": "healthy" if all_loaded else "models_not_loaded",
        "message": "All local AI models ready" if all_loaded else "Some models are not loaded",
        "models": models_status
    })

@app.route("/debug", methods=["GET"])
def debug_info():
    """Debug endpoint to check model status"""
    debug_info = {
        "emotion_model_loaded": emotion_model is not None,
        "sentiment_model_loaded": sentiment_model is not None,
        "embedding_model_loaded": embedding_model is not None,
        "xgboost_model_loaded": like_model is not None,
        "xgboost_path_exists": os.path.exists(XGBOOST_MODEL_PATH),
        "like_count_path_exists": os.path.exists(LIKE_COUNT_MODEL_PATH),
        "xgboost_path": XGBOOST_MODEL_PATH,
        "like_count_path": LIKE_COUNT_MODEL_PATH
    }
    
    # Add file listing
    if os.path.exists(LIKE_COUNT_MODEL_PATH):
        debug_info["files_in_like_count_dir"] = os.listdir(LIKE_COUNT_MODEL_PATH)
    
    if like_model:
        debug_info["xgboost_type"] = str(type(like_model))
        debug_info["xgboost_has_predict"] = hasattr(like_model, 'predict')
    
    return jsonify(debug_info)

if __name__ == "__main__":
    print("🚀 Starting Flask server with enhanced debugging...")
    print(f"📁 Emotion model path: {EMOTION_MODEL_PATH}")
    print(f"📁 Sentiment model path: {SENTIMENT_MODEL_PATH}")
    print(f"📁 Like count model path: {LIKE_COUNT_MODEL_PATH}")
    print(f"📁 XGBoost model path: {XGBOOST_MODEL_PATH}")
    print(f"📜 History file: {HISTORY_FILE}")
    
    # Print model status
    print("\n🤖 Model Status:")
    print(f"   Emotion: {'✅ Loaded' if emotion_model else '❌ Not loaded'}")
    print(f"   Sentiment: {'✅ Loaded' if sentiment_model else '❌ Not loaded'}")
    print(f"   BERT Embedding: {'✅ Loaded' if embedding_model else '❌ Not loaded'}")
    print(f"   XGBoost: {'✅ Loaded' if like_model else '❌ Not loaded'}")
    
    if like_model:
        print(f"   XGBoost Type: {type(like_model)}")
    
    print("\n📡 Server running on http://localhost:5000")
    print("🔍 Debug endpoint: http://localhost:5000/debug")
    print("🧪 Test like count: http://localhost:5000/test-like-count")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
