"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Loader2,
  MessageSquare,
  Heart,
  ThumbsUp,
  Sparkles,
  Brain,
  TrendingUp,
  History,
  Trash2,
  BarChart3,
  Clock,
  Star,
  Flame,
  Target,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"

interface PredictionResult {
  emotion: string
  sentiment: string
  like_count: string
  history_id?: number
  status?: string
}

interface HistoryItem {
  id: number
  timestamp: string
  comment: string
  full_comment: string
  emotion: string
  sentiment: string
  like_count: string
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
  like_count_model: {
    loaded: boolean
    path: string
    exists: boolean
    xgboost_exists?: boolean
    bert_loaded?: boolean
    xgboost_loaded?: boolean
  }
}

interface Stats {
  total_predictions: number
  emotion_stats: { [key: string]: number }
  sentiment_stats: { [key: string]: number }
  like_count_stats: { [key: string]: number }
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
    error: "⚠️",
    model_not_loaded: "❌",
    unknown: "❓",
  }
  return emotionMap[emotion.toLowerCase()] || "❓"
}

const getSentimentEmoji = (sentiment: string) => {
  const sentimentMap: { [key: string]: string } = {
    positive: "👍",
    negative: "👎",
    neutral: "🤷",
    error: "⚠️",
    model_not_loaded: "❌",
    unknown: "❓",
  }
  return sentimentMap[sentiment.toLowerCase()] || "❓"
}

const getLikeCountEmoji = (likeCount: string) => {
  const likeCountMap: { [key: string]: string } = {
    low: "👤",
    medium: "👥",
    high: "🔥",
    viral: "🚀",
    error: "⚠️",
    model_not_loaded: "❌",
    unknown: "❓",
  }
  return likeCountMap[likeCount.toLowerCase()] || "❓"
}

const getLikeCountDescription = (likeCount: string) => {
  const descriptionMap: { [key: string]: string } = {
    low: "0-99 likes",
    medium: "100-500 likes",
    high: "501-1500 likes",
    viral: "1500+ likes",
    error: "Prediction error",
    model_not_loaded: "Model not loaded",
    unknown: "Unknown range",
  }
  return descriptionMap[likeCount.toLowerCase()] || "Unknown range"
}

const getLikeCountColor = (likeCount: string) => {
  const colorMap: { [key: string]: string } = {
    low: "linear-gradient(135deg, #94a3b8, #64748b)",
    medium: "linear-gradient(135deg, #60a5fa, #3b82f6)",
    high: "linear-gradient(135deg, #f97316, #ea580c)",
    viral: "linear-gradient(135deg, #ec4899, #be185d)",
    error: "linear-gradient(135deg, #ef4444, #dc2626)",
    model_not_loaded: "linear-gradient(135deg, #6b7280, #4b5563)",
    unknown: "linear-gradient(135deg, #9ca3af, #6b7280)",
  }
  return colorMap[likeCount.toLowerCase()] || "linear-gradient(135deg, #9ca3af, #6b7280)"
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function Component() {
  const [comment, setComment] = useState("")
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<"analyze" | "history" | "stats">("analyze")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (prediction) {
      setTimeout(() => setShowResults(true), 300)
    } else {
      setShowResults(false)
    }
  }, [prediction])

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory()
    } else if (activeTab === "stats") {
      fetchStats()
    }
  }, [activeTab])

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

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch("http://localhost:5000/debug")
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
      }
    } catch (error) {
      console.error("Error fetching debug info:", error)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch("http://localhost:5000/history")
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const deleteHistoryItem = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/history/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchHistory()
      }
    } catch (error) {
      console.error("Error deleting history item:", error)
    }
  }

  const clearHistory = async () => {
    try {
      const response = await fetch("http://localhost:5000/history/clear", {
        method: "DELETE",
      })
      if (response.ok) {
        setHistory([])
        setStats(null)
      }
    } catch (error) {
      console.error("Error clearing history:", error)
    }
  }

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

  const renderStatsChart = (data: { [key: string]: number }, title: string, icon: React.ReactNode) => {
    const total = Object.values(data).reduce((sum, count) => sum + count, 0)
    if (total === 0) return null

    return (
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
          animation: "slideInUp 0.6s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", color: "#4f46e5" }}>
          {icon}
          <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>{title}</h4>
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {Object.entries(data).map(([key, count], index) => {
            const percentage = (count / total) * 100
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ minWidth: "80px", fontSize: "0.9rem", color: "#6b7280", textTransform: "capitalize" }}>
                  {key}
                </div>
                <div style={{ flex: 1, background: "#f3f4f6", borderRadius: "8px", height: "8px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      background: `hsl(${index * 60}, 70%, 60%)`,
                      borderRadius: "8px",
                      animation: `fillBar 1s ease-out ${index * 0.1}s both`,
                    }}
                  />
                </div>
                <div style={{ minWidth: "40px", fontSize: "0.8rem", color: "#9ca3af", textAlign: "right" }}>
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Floating particles */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "6px",
              height: "6px",
              background: "rgba(255, 255, 255, 0.3)",
              borderRadius: "50%",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <MessageSquare size={48} color="#ffffff" />
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                background: "linear-gradient(45deg, #ffffff, #f0f0f0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              YouTube Comment Analyzer
            </h1>
          </div>
          <p style={{ fontSize: "1.1rem", color: "#ffffff", opacity: 0.9, maxWidth: "600px", margin: "0 auto 20px" }}>
            Analyze YouTube comments with AI models and track your analysis history
          </p>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "30px",
          }}
        >
          {[
            { key: "analyze", label: "Analyze", icon: <Brain size={20} /> },
            { key: "history", label: "History", icon: <History size={20} /> },
            { key: "stats", label: "Statistics", icon: <BarChart3 size={20} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: activeTab === tab.key ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.2)",
                color: activeTab === tab.key ? "#4f46e5" : "#ffffff",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "600",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
                }
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Connection Status */}
        {isConnected !== null && (
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "30px",
              background: isConnected ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
              border: `2px solid ${isConnected ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)"}`,
              color: "#ffffff",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: isConnected ? "#22c55e" : "#ef4444",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ fontWeight: "bold" }}>
                {isConnected ? "Connected to Local AI Models" : "Cannot connect to local models"}
              </span>
              <button
                onClick={() => {
                  checkConnection()
                  fetchDebugInfo()
                }}
                style={{
                  padding: "4px 8px",
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "6px",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {modelStatus && (
              <div
                style={{ fontSize: "0.9rem", display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}
              >
                <span style={{ color: modelStatus.emotion_model.loaded ? "#22c55e" : "#ef4444" }}>
                  Emotion: {modelStatus.emotion_model.loaded ? "✅" : "❌"}
                </span>
                <span style={{ color: modelStatus.sentiment_model.loaded ? "#22c55e" : "#ef4444" }}>
                  Sentiment: {modelStatus.sentiment_model.loaded ? "✅" : "❌"}
                </span>
                <span style={{ color: modelStatus.like_count_model.loaded ? "#22c55e" : "#ef4444" }}>
                  Like Count: {modelStatus.like_count_model.loaded ? "✅" : "❌"}
                </span>
                {modelStatus.like_count_model && (
                  <>
                    <span style={{ color: modelStatus.like_count_model.bert_loaded ? "#22c55e" : "#ef4444" }}>
                      BERT: {modelStatus.like_count_model.bert_loaded ? "✅" : "❌"}
                    </span>
                    <span style={{ color: modelStatus.like_count_model.xgboost_loaded ? "#22c55e" : "#ef4444" }}>
                      XGBoost: {modelStatus.like_count_model.xgboost_loaded ? "✅" : "❌"}
                    </span>
                  </>
                )}
              </div>
            )}
            {debugInfo && (
              <div style={{ fontSize: "0.8rem", marginTop: "10px", opacity: 0.8 }}>
                <details>
                  <summary style={{ cursor: "pointer" }}>Debug Info</summary>
                  <pre style={{ textAlign: "left", marginTop: "10px", fontSize: "0.7rem" }}>
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "analyze" && (
          <>
            {/* Input Form */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "20px",
                padding: "30px",
                marginBottom: "30px",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                backdropFilter: "blur(10px)",
                animation: "slideInUp 0.6s ease-out",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "#4f46e5" }}
              >
                <MessageSquare size={24} />
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>Comment Input</h2>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ position: "relative", marginBottom: "20px" }}>
                  <textarea
                    placeholder="Enter your YouTube comment here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      minHeight: "120px",
                      padding: "15px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      fontSize: "1rem",
                      resize: "none",
                      outline: "none",
                      transition: "all 0.3s ease",
                      background: "#ffffff",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4f46e5"
                      e.target.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb"
                      e.target.style.boxShadow = "none"
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      right: "10px",
                      fontSize: "0.8rem",
                      color: "#6b7280",
                      background: "#ffffff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {comment.length}/500
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      padding: "15px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "2px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "12px",
                      color: "#dc2626",
                      marginBottom: "20px",
                      fontWeight: "500",
                      animation: "shake 0.5s ease-in-out",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: "15px" }}>
                  <button
                    type="submit"
                    disabled={isLoading || !comment.trim() || !isConnected}
                    style={{
                      flex: 1,
                      height: "50px",
                      background:
                        isLoading || !comment.trim() || !isConnected
                          ? "#9ca3af"
                          : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      cursor: isLoading || !comment.trim() || !isConnected ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      transition: "all 0.3s ease",
                      transform: "scale(1)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading && comment.trim() && isConnected) {
                        e.currentTarget.style.transform = "scale(1.02)"
                        e.currentTarget.style.boxShadow = "0 10px 20px rgba(79, 70, 229, 0.3)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Analyze Comment
                      </>
                    )}
                  </button>

                  {(comment || prediction) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isLoading}
                      style={{
                        padding: "0 20px",
                        height: "50px",
                        background: "#ffffff",
                        color: "#4b5563",
                        border: "2px solid #e5e7eb",
                        borderRadius: "12px",
                        fontSize: "1rem",
                        fontWeight: "500",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.background = "#f9fafb"
                          e.currentTarget.style.borderColor = "#d1d5db"
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#ffffff"
                        e.currentTarget.style.borderColor = "#e5e7eb"
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Results */}
            {prediction && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "25px",
                  marginBottom: "30px",
                  opacity: showResults ? 1 : 0,
                  transform: showResults ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.8s ease",
                }}
              >
                {/* Emotion Result */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "20px",
                    padding: "30px",
                    textAlign: "center",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(10px)",
                    transform: "scale(1)",
                    transition: "all 0.3s ease",
                    animation: "slideInLeft 0.6s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02) rotate(1deg)"
                    e.currentTarget.style.boxShadow = "0 25px 50px rgba(0, 0, 0, 0.15)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)"
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      marginBottom: "20px",
                      color: "#ec4899",
                    }}
                  >
                    <Heart size={24} style={{ animation: "pulse 2s infinite" }} />
                    <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: 0 }}>Emotion</h3>
                  </div>
                  <div style={{ fontSize: "4rem", marginBottom: "20px", animation: "bounce 2s infinite" }}>
                    {getEmotionEmoji(prediction.emotion)}
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "10px 20px",
                      background:
                        prediction.emotion === "error" || prediction.emotion === "model_not_loaded"
                          ? "linear-gradient(135deg, #ef4444, #dc2626)"
                          : "linear-gradient(135deg, #fbbf24, #f59e0b)",
                      color: "#ffffff",
                      borderRadius: "25px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      marginBottom: "15px",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    {prediction.emotion.charAt(0).toUpperCase() + prediction.emotion.slice(1).replace("_", " ")}
                  </div>
                  <p style={{ color: "#6b7280", fontWeight: "500", margin: 0 }}>Detected emotion</p>
                </div>

                {/* Sentiment Result */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "20px",
                    padding: "30px",
                    textAlign: "center",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(10px)",
                    transform: "scale(1)",
                    transition: "all 0.3s ease",
                    animation: "slideInUp 0.6s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02) rotate(-1deg)"
                    e.currentTarget.style.boxShadow = "0 25px 50px rgba(0, 0, 0, 0.15)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)"
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      marginBottom: "20px",
                      color: "#10b981",
                    }}
                  >
                    <ThumbsUp size={24} style={{ animation: "pulse 2s infinite" }} />
                    <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: 0 }}>Sentiment</h3>
                  </div>
                  <div
                    style={{
                      fontSize: "4rem",
                      marginBottom: "20px",
                      animation: "bounce 2s infinite",
                      animationDelay: "0.3s",
                    }}
                  >
                    {getSentimentEmoji(prediction.sentiment)}
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "10px 20px",
                      background:
                        prediction.sentiment === "error" || prediction.sentiment === "model_not_loaded"
                          ? "linear-gradient(135deg, #ef4444, #dc2626)"
                          : prediction.sentiment === "positive"
                            ? "linear-gradient(135deg, #34d399, #10b981)"
                            : prediction.sentiment === "negative"
                              ? "linear-gradient(135deg, #f87171, #ef4444)"
                              : "linear-gradient(135deg, #9ca3af, #6b7280)",
                      color: "#ffffff",
                      borderRadius: "25px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      marginBottom: "15px",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    {prediction.sentiment.charAt(0).toUpperCase() + prediction.sentiment.slice(1).replace("_", " ")}
                  </div>
                  <p style={{ color: "#6b7280", fontWeight: "500", margin: 0 }}>Detected sentiment</p>
                </div>

                {/* Like Count Prediction Result */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "20px",
                    padding: "30px",
                    textAlign: "center",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(10px)",
                    transform: "scale(1)",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    animation: "slideInRight 0.6s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05) rotate(0.5deg)"
                    e.currentTarget.style.boxShadow = "0 30px 60px rgba(0, 0, 0, 0.2)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)"
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {/* Sparkle effect for viral content */}
                  {prediction.like_count === "viral" && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)",
                        animation: "sparkle 2s ease-in-out infinite",
                      }}
                    />
                  )}

                  {/* Warning indicator for errors */}
                  {(prediction.like_count === "error" || prediction.like_count === "model_not_loaded") && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        color: "#ef4444",
                        zIndex: 3,
                      }}
                    >
                      <AlertTriangle size={20} />
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      marginBottom: "20px",
                      color: "#8b5cf6",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <TrendingUp
                      size={24}
                      style={{
                        animation:
                          prediction.like_count === "viral" ? "glow 1.5s ease-in-out infinite" : "pulse 2s infinite",
                      }}
                    />
                    <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: 0 }}>Like Count</h3>
                  </div>

                  <div
                    style={{
                      fontSize: "4rem",
                      marginBottom: "20px",
                      animation:
                        prediction.like_count === "viral"
                          ? "viralBounce 1s ease-in-out infinite"
                          : "bounce 2s infinite",
                      animationDelay: "0.6s",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {getLikeCountEmoji(prediction.like_count)}
                  </div>

                  <div
                    style={{
                      display: "inline-block",
                      padding: "12px 24px",
                      background: getLikeCountColor(prediction.like_count),
                      color: "#ffffff",
                      borderRadius: "25px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      marginBottom: "10px",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      boxShadow: prediction.like_count === "viral" ? "0 0 20px rgba(236, 72, 153, 0.5)" : "none",
                      animation: prediction.like_count === "viral" ? "glow 2s ease-in-out infinite" : "none",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {prediction.like_count.charAt(0).toUpperCase() + prediction.like_count.slice(1).replace("_", " ")}
                  </div>

                  <p
                    style={{
                      color: "#6b7280",
                      fontWeight: "500",
                      margin: "5px 0 0 0",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {getLikeCountDescription(prediction.like_count)}
                  </p>

                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.9rem",
                      margin: "5px 0 0 0",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    Predicted engagement level
                  </p>
                </div>
              </div>
            )}

            {/* Sample Comments */}
            {!prediction && !isLoading && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "20px",
                  padding: "30px",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                  backdropFilter: "blur(10px)",
                  animation: "slideInUp 0.8s ease-out",
                }}
              >
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", marginBottom: "20px", color: "#374151" }}>
                  Sample Comments
                </h3>
                <div style={{ display: "grid", gap: "15px" }}>
                  {[
                    "This video is absolutely amazing and entertaining! Thank you for sharing",
                    "The content is boring and not interesting at all",
                    "This video is just okay, nothing special about it",
                    "OMG this is the best video ever! Everyone needs to see this! 🔥🔥🔥",
                  ].map((sampleComment, index) => (
                    <button
                      key={index}
                      onClick={() => setComment(sampleComment)}
                      style={{
                        textAlign: "left",
                        padding: "15px",
                        background: "linear-gradient(135deg, #f9fafb, #f3f4f6)",
                        border: "2px solid transparent",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        fontSize: "0.95rem",
                        color: "#374151",
                        animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #ede9fe, #ddd6fe)"
                        e.currentTarget.style.borderColor = "#8b5cf6"
                        e.currentTarget.style.transform = "scale(1.02)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #f9fafb, #f3f4f6)"
                        e.currentTarget.style.borderColor = "transparent"
                        e.currentTarget.style.transform = "scale(1)"
                      }}
                    >
                      "{sampleComment}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "20px",
              padding: "30px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(10px)",
              animation: "slideInUp 0.6s ease-out",
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#4f46e5" }}>
                <History size={24} />
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>Analysis History</h2>
                <span
                  style={{
                    background: "#4f46e5",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  {history.length}
                </span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)"
                    e.currentTarget.style.boxShadow = "0 5px 15px rgba(239, 68, 68, 0.3)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                <History size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
                <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>No analysis history yet</p>
                <p style={{ fontSize: "0.9rem" }}>Start analyzing comments to see your history here!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px", maxHeight: "600px", overflowY: "auto" }}>
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                      border: "2px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "20px",
                      transition: "all 0.3s ease",
                      animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(5px)"
                      e.currentTarget.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.1)"
                      e.currentTarget.style.borderColor = "#8b5cf6"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)"
                      e.currentTarget.style.boxShadow = "none"
                      e.currentTarget.style.borderColor = "#e2e8f0"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "15px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Clock size={16} color="#6b7280" />
                          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.95rem",
                            color: "#374151",
                            margin: "0 0 15px 0",
                            lineHeight: "1.5",
                            fontStyle: "italic",
                          }}
                        >
                          "{item.comment}"
                        </p>
                      </div>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        style={{
                          padding: "8px",
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"
                          e.currentTarget.style.transform = "scale(1.1)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"
                          e.currentTarget.style.transform = "scale(1)"
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                          background: "rgba(236, 72, 153, 0.1)",
                          borderRadius: "10px",
                          border: "1px solid rgba(236, 72, 153, 0.2)",
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>{getEmotionEmoji(item.emotion)}</span>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#ec4899",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.emotion.replace("_", " ")}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                          background:
                            item.sentiment === "positive"
                              ? "rgba(34, 197, 94, 0.1)"
                              : item.sentiment === "negative"
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(156, 163, 175, 0.1)",
                          borderRadius: "10px",
                          border: `1px solid ${
                            item.sentiment === "positive"
                              ? "rgba(34, 197, 94, 0.2)"
                              : item.sentiment === "negative"
                                ? "rgba(239, 68, 68, 0.2)"
                                : "rgba(156, 163, 175, 0.2)"
                          }`,
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>{getSentimentEmoji(item.sentiment)}</span>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color:
                              item.sentiment === "positive"
                                ? "#22c55e"
                                : item.sentiment === "negative"
                                  ? "#ef4444"
                                  : "#9ca3af",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.sentiment.replace("_", " ")}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                          background:
                            item.like_count === "viral"
                              ? "rgba(236, 72, 153, 0.1)"
                              : item.like_count === "high"
                                ? "rgba(249, 115, 22, 0.1)"
                                : item.like_count === "medium"
                                  ? "rgba(59, 130, 246, 0.1)"
                                  : item.like_count === "error" || item.like_count === "model_not_loaded"
                                    ? "rgba(239, 68, 68, 0.1)"
                                    : "rgba(148, 163, 184, 0.1)",
                          borderRadius: "10px",
                          border: `1px solid ${
                            item.like_count === "viral"
                              ? "rgba(236, 72, 153, 0.2)"
                              : item.like_count === "high"
                                ? "rgba(249, 115, 22, 0.2)"
                                : item.like_count === "medium"
                                  ? "rgba(59, 130, 246, 0.2)"
                                  : item.like_count === "error" || item.like_count === "model_not_loaded"
                                    ? "rgba(239, 68, 68, 0.2)"
                                    : "rgba(148, 163, 184, 0.2)"
                          }`,
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>{getLikeCountEmoji(item.like_count)}</span>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color:
                              item.like_count === "viral"
                                ? "#ec4899"
                                : item.like_count === "high"
                                  ? "#f97316"
                                  : item.like_count === "medium"
                                    ? "#3b82f6"
                                    : item.like_count === "error" || item.like_count === "model_not_loaded"
                                      ? "#ef4444"
                                      : "#94a3b8",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.like_count.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <div
            style={{
              animation: "slideInUp 0.6s ease-out",
            }}
          >
            {stats && stats.total_predictions > 0 ? (
              <>
                {/* Overview Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px",
                    marginBottom: "30px",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "16px",
                      padding: "25px",
                      textAlign: "center",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                      backdropFilter: "blur(10px)",
                      animation: "slideInUp 0.6s ease-out",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        marginBottom: "15px",
                        color: "#4f46e5",
                      }}
                    >
                      <Target size={24} />
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>Total Predictions</h3>
                    </div>
                    <div
                      style={{
                        fontSize: "2.5rem",
                        fontWeight: "bold",
                        color: "#4f46e5",
                        animation: "countUp 1s ease-out",
                      }}
                    >
                      {stats.total_predictions}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "16px",
                      padding: "25px",
                      textAlign: "center",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                      backdropFilter: "blur(10px)",
                      animation: "slideInUp 0.6s ease-out 0.2s both",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        marginBottom: "15px",
                        color: "#ec4899",
                      }}
                    >
                      <Star size={24} />
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>Most Common Emotion</h3>
                    </div>
                    <div style={{ fontSize: "2rem", marginBottom: "10px" }}>
                      {getEmotionEmoji(
                        Object.entries(stats.emotion_stats).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral",
                      )}
                    </div>
                    <div
                      style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#ec4899", textTransform: "capitalize" }}
                    >
                      {Object.entries(stats.emotion_stats)
                        .sort(([, a], [, b]) => b - a)[0]?.[0]
                        ?.replace("_", " ") || "None"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "16px",
                      padding: "25px",
                      textAlign: "center",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                      backdropFilter: "blur(10px)",
                      animation: "slideInUp 0.6s ease-out 0.4s both",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        marginBottom: "15px",
                        color: "#10b981",
                      }}
                    >
                      <ThumbsUp size={24} />
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>Most Common Sentiment</h3>
                    </div>
                    <div style={{ fontSize: "2rem", marginBottom: "10px" }}>
                      {getSentimentEmoji(
                        Object.entries(stats.sentiment_stats).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral",
                      )}
                    </div>
                    <div
                      style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#10b981", textTransform: "capitalize" }}
                    >
                      {Object.entries(stats.sentiment_stats)
                        .sort(([, a], [, b]) => b - a)[0]?.[0]
                        ?.replace("_", " ") || "None"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "16px",
                      padding: "25px",
                      textAlign: "center",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                      backdropFilter: "blur(10px)",
                      animation: "slideInUp 0.6s ease-out 0.6s both",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        marginBottom: "15px",
                        color: "#8b5cf6",
                      }}
                    >
                      <Flame size={24} />
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>Viral Content</h3>
                    </div>
                    <div
                      style={{
                        fontSize: "2.5rem",
                        fontWeight: "bold",
                        color: "#8b5cf6",
                        animation: "countUp 1s ease-out 0.6s both",
                      }}
                    >
                      {stats.like_count_stats.viral || 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>Viral predictions</div>
                  </div>
                </div>

                {/* Statistics Charts */}
                <div
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "25px" }}
                >
                  {renderStatsChart(stats.emotion_stats, "Emotion Distribution", <Heart size={20} />)}
                  {renderStatsChart(stats.sentiment_stats, "Sentiment Distribution", <ThumbsUp size={20} />)}
                  {renderStatsChart(stats.like_count_stats, "Like Count Distribution", <TrendingUp size={20} />)}
                </div>
              </>
            ) : (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "20px",
                  padding: "60px",
                  textAlign: "center",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                  backdropFilter: "blur(10px)",
                  animation: "slideInUp 0.6s ease-out",
                }}
              >
                <BarChart3 size={64} style={{ color: "#9ca3af", marginBottom: "20px" }} />
                <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#374151", marginBottom: "10px" }}>
                  No Statistics Available
                </h3>
                <p style={{ fontSize: "1rem", color: "#6b7280", marginBottom: "20px" }}>
                  Start analyzing comments to see detailed statistics and insights!
                </p>
                <button
                  onClick={() => setActiveTab("analyze")}
                  style={{
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)"
                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(79, 70, 229, 0.3)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  Start Analyzing
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-10px); }
          70% { transform: translateY(-5px); }
          90% { transform: translateY(-2px); }
        }
        @keyframes viralBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.5);
            filter: brightness(1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(236, 72, 153, 0.8);
            filter: brightness(1.2);
          }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
        @keyframes countUp {
          from { 
            opacity: 0;
            transform: scale(0.5);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
