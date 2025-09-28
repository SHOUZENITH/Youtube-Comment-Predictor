"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Heart, ThumbsUp, Sparkles, Brain, Zap, HardDrive } from "lucide-react"

interface PredictionResult {
  emotion: string
  sentiment: string
}

interface ModelStatus {
  emotion_model: {
    loaded: boolean
    path: string
    exists: boolean
  }
  sentiment_model: {
    loaded: boolean
    path: string
    exists: boolean
  }
}

const getEmotionEmoji = (emotion: string) => {
  const emotionMap: { [key: string]: string } = {
    joy: "😄",
    sadness: "😢",
    anger: "😠",
    fear: "😨",
    disgust: "🤢",
    surprise: "😲",
    neutral: "😐",
  }
  return emotionMap[emotion.toLowerCase()] || "😐"
}

const getSentimentEmoji = (sentiment: string) => {
  const sentimentMap: { [key: string]: string } = {
    positive: "👍",
    negative: "👎",
    neutral: "🤷",
  }
  return sentimentMap[sentiment.toLowerCase()] || "🤷"
}

const getEmotionColor = (emotion: string) => {
  const colorMap: { [key: string]: string } = {
    joy: "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300",
    sadness: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300",
    anger: "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300",
    fear: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-300",
    disgust: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
    surprise: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-300",
    neutral: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300",
  }
  return colorMap[emotion.toLowerCase()] || "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300"
}

const getSentimentColor = (sentiment: string) => {
  const colorMap: { [key: string]: string } = {
    positive: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
    negative: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-300",
    neutral: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300",
  }
  return (
    colorMap[sentiment.toLowerCase()] || "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300"
  )
}

const FloatingParticle = ({ delay }: { delay: number }) => (
  <div
    className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-bounce"
    style={{
      left: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${3 + Math.random() * 2}s`,
    }}
  />
)

export default function Component() {
  const [comment, setComment] = useState("")
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("http://localhost:5000/health")
        if (response.ok) {
          const data = await response.json()
          setIsConnected(data.status === "healthy")
          setModelStatus(data.models)
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        setIsConnected(false)
      }
    }

    checkConnection()
  }, [])

  useEffect(() => {
    if (prediction) {
      setTimeout(() => setShowResults(true), 100)
    } else {
      setShowResults(false)
    }
  }, [prediction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comment.trim()) {
      setError("Please enter a comment first")
      return
    }

    setIsLoading(true)
    setError("")
    setPrediction(null)
    setShowResults(false)

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: comment.trim() }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      setPrediction(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while processing the comment")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setComment("")
    setPrediction(null)
    setError("")
    setShowResults(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 0.5} />
      ))}

      {/* Animated Background Shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div
        className="absolute top-40 right-10 w-72 h-72 bg-gradient-to-r from-yellow-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-green-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
        style={{ animationDelay: "4s" }}
      ></div>

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <MessageSquare className="w-12 h-12 text-indigo-600 animate-pulse" />
              <Sparkles
                className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              YouTube Comment Analyzer
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Analyze YouTube comments using local AI models for emotion and sentiment detection
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>Local Emotion Model</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Local Sentiment Model</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span>Offline Processing</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {isConnected !== null && (
          <div
            className={`text-center p-4 rounded-xl transition-all duration-500 transform ${
              isConnected
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200 scale-100"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-200 scale-100"
            } shadow-lg animate-slide-down`}
          >
            {isConnected ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Connected to Local AI Models</span>
                </div>
                {modelStatus && (
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-center gap-4">
                      <span className={`${modelStatus.emotion_model.loaded ? "text-green-600" : "text-red-600"}`}>
                        Emotion: {modelStatus.emotion_model.loaded ? "✅ Loaded" : "❌ Not Loaded"}
                      </span>
                      <span className={`${modelStatus.sentiment_model.loaded ? "text-green-600" : "text-red-600"}`}>
                        Sentiment: {modelStatus.sentiment_model.loaded ? "✅ Loaded" : "❌ Not Loaded"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Cannot connect to local models</span>
                </div>
                <div className="text-sm">
                  Make sure Flask server is running and model files are in the correct directories
                </div>
              </div>
            )}
          </div>
        )}

        {/* Model Status Details */}
        {modelStatus && !isConnected && (
          <Card className="shadow-lg border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">Model Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>Emotion Model:</span>
                  <span className={modelStatus.emotion_model.loaded ? "text-green-600" : "text-red-600"}>
                    {modelStatus.emotion_model.loaded ? "✅ Loaded" : "❌ Not Found"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sentiment Model:</span>
                  <span className={modelStatus.sentiment_model.loaded ? "text-green-600" : "text-red-600"}>
                    {modelStatus.sentiment_model.loaded ? "✅ Loaded" : "❌ Not Found"}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800 mb-2">Required model files:</p>
                  <ul className="text-blue-700 text-xs space-y-1">
                    <li>• config.json</li>
                    <li>• pytorch_model.bin (or model.safetensors)</li>
                    <li>• tokenizer.json</li>
                    <li>• tokenizer_config.json</li>
                    <li>• vocab.txt (or equivalent)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input Form */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <MessageSquare className="w-6 h-6" />
              Comment Input
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Textarea
                  placeholder="Enter your YouTube comment here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[140px] resize-none text-lg border-2 border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 rounded-xl"
                  disabled={isLoading}
                />
                <div className="absolute bottom-3 right-3 text-sm text-gray-400 bg-white px-2 py-1 rounded-md">
                  {comment.length}/500
                </div>
              </div>

              {error && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl animate-shake">
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading || !comment.trim() || !isConnected}
                  className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Analyze Comment
                    </>
                  )}
                </Button>

                {(comment || prediction) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="h-14 px-8 border-2 hover:bg-gray-50 transform hover:scale-105 transition-all duration-300"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {prediction && (
          <div
            className={`grid md:grid-cols-2 gap-8 transition-all duration-700 transform ${showResults ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            {/* Emotion Result */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Heart className="w-6 h-6 animate-pulse" />
                  Emotion Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="text-8xl animate-bounce" style={{ animationDuration: "2s" }}>
                    {getEmotionEmoji(prediction.emotion)}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xl px-6 py-3 font-bold border-2 transform hover:scale-110 transition-all duration-300 ${getEmotionColor(prediction.emotion)}`}
                  >
                    {prediction.emotion.charAt(0).toUpperCase() + prediction.emotion.slice(1)}
                  </Badge>
                  <p className="text-gray-600 font-medium">Detected emotion from the comment</p>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Result */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:-rotate-1">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <ThumbsUp className="w-6 h-6 animate-pulse" />
                  Sentiment Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="text-8xl animate-bounce" style={{ animationDuration: "2s", animationDelay: "0.5s" }}>
                    {getSentimentEmoji(prediction.sentiment)}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xl px-6 py-3 font-bold border-2 transform hover:scale-110 transition-all duration-300 ${getSentimentColor(prediction.sentiment)}`}
                  >
                    {prediction.sentiment.charAt(0).toUpperCase() + prediction.sentiment.slice(1)}
                  </Badge>
                  <p className="text-gray-600 font-medium">Detected sentiment from the comment</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sample Comments */}
        {!prediction && !isLoading && (
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg">
              <CardTitle className="text-xl">Sample Comments</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-4">
                {[
                  "This video is absolutely amazing and entertaining! Thank you for sharing",
                  "The content is boring and not interesting at all",
                  "This video is just okay, nothing special about it",
                ].map((sampleComment, index) => (
                  <button
                    key={index}
                    onClick={() => setComment(sampleComment)}
                    className="text-left p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-indigo-200"
                  >
                    <span className="text-gray-700 font-medium">"{sampleComment}"</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.5s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  )
}
