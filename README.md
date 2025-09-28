YouTube Comment Predictor

This project was developed as a Machine Learning group project (3 members) designed to analyze and evaluate YouTube comments. It performs two main tasks:

Sentiment & Emotion Prediction – Predicting whether a comment is positive/negative/neutral and detecting the underlying emotion.

Like Count Estimation – Estimating the number of likes a YouTube comment might receive.

🔧 Models Used

DistilBERT (via Hugging Face)

Lightweight transformer model for sentiment and emotion classification.

XGBoost Regressor

Gradient boosting model for predicting like counts from structured features.

📂 Project Structure

Due to size limits, trained models and dependencies are provided via Google Drive.

**Models & node_modules** → [Google Drive Link](https://drive.google.com/drive/folders/12QAQB9CRDT5UYmuqFdLagSMWP6qbP068?usp=sharing)   

Notebooks

**Dataset Collection (YouTube API)** → [Colab Notebook](https://colab.research.google.com/drive/1uokj6OBbHPN9YJH7z79J6Ie4yZ1bNwf1?usp=sharing)  

**Model Training** → [Colab Notebook](https://colab.research.google.com/drive/1PVCftQQqPKmQrrOS9my69fYKTHHZiWZz?usp=sharing)

🚀 How It Works

Data Collection – Comments are collected using the YouTube Data API.

Preprocessing – Text cleaning and preparation for transformer input.

Sentiment & Emotion Analysis – DistilBERT classifies comments into sentiment categories and emotions.

Like Prediction – XGBoost predicts the expected number of likes based on comment text features.

📌 Requirements

Python 3.8+

PyTorch / TensorFlow

Hugging Face Transformers

XGBoost

Google Colab (for training & running notebooks)

📖 Usage

Download the models & dependencies from Google Drive.

Run the preprocessing & training notebooks (if retraining is needed).

Use the predictor script/notebook to analyze new YouTube comments.

👥 Team

This project was built by a group of 3 students as part of a machine learning course.
