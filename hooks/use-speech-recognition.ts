"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void
  onEnd?: () => void
  language?: string
}

interface SpeechRecognitionResult {
  transcript: string
  isListening: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

export function useSpeechRecognition({
  onResult,
  onEnd,
  language = "en-US",
}: UseSpeechRecognitionProps = {}): SpeechRecognitionResult {
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setError("Speech recognition is not supported in this browser.")
        return
      }

      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setError("Speech recognition is not supported on iOS Safari.")
        return
      }

      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false // Better for mobile
      recognitionInstance.interimResults = false // Simplify to avoid bugs
      recognitionInstance.lang = language

      recognitionInstance.onstart = () => {
        console.log("Speech recognition started")
        setIsListening(true)
      }

      recognitionInstance.onresult = (event: any) => {
        let currentTranscript = ""
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript + " "
          }
        }

        currentTranscript = currentTranscript.trim()
        setTranscript(currentTranscript)
        if (onResult) onResult(currentTranscript)
      }

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event)
        setError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        console.log("Speech recognition ended")
        setIsListening(false)
        if (onEnd) onEnd()
      }

      recognitionRef.current = recognitionInstance
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [language, onEnd, onResult])

  const startListening = useCallback(() => {
    setError(null)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        // isListening is set via onstart
      } catch (err) {
        console.error("Error starting speech recognition:", err)
        setError("Error starting speech recognition")
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error,
  }
}
