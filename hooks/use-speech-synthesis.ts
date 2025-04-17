"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface UseSpeechSynthesisProps {
  onEnd?: () => void
  onError?: (error: any) => void
}

interface SpeechSynthesisResult {
  speak: (text: string, lang?: string) => void
  cancel: () => void
  isSpeaking: boolean
  voices: SpeechSynthesisVoice[]
  error: string | null
}

export function useSpeechSynthesis({ onEnd, onError }: UseSpeechSynthesisProps = {}): SpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [error, setError] = useState<string | null>(null)

  // Use a ref to track if we've already loaded voices
  const voicesLoadedRef = useRef(false)

  // Load voices only once when the component mounts
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis && !voicesLoadedRef.current) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        if (availableVoices.length > 0) {
          setVoices(availableVoices)
          voicesLoadedRef.current = true
        }
      }

      loadVoices() // Try to load immediately

      // Also set up the event listener for when voices change
      window.speechSynthesis.onvoiceschanged = loadVoices

      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null
        }
      }
    }
  }, [])

  const speak = useCallback(
    (text: string, lang = "en-US") => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        setError("Speech synthesis is not supported in this browser.")
        if (onError) onError("Speech synthesis not supported")
        return
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Find a voice for the specified language
      const availableVoices = window.speechSynthesis.getVoices()
      const voice = availableVoices.find((v) => v.lang.includes(lang.slice(0, 2)))
      if (voice) {
        utterance.voice = voice
      }

      utterance.lang = lang
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        if (onEnd) onEnd()
      }
      utterance.onerror = (event) => {
        setIsSpeaking(false)
        setError(`Speech synthesis error: ${event.error}`)
        if (onError) onError(event)
      }

      window.speechSynthesis.speak(utterance)
    },
    [onEnd, onError],
  )

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    speak,
    cancel,
    isSpeaking,
    voices,
    error,
  }
}
