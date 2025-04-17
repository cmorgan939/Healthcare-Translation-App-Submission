"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { translateText } from "@/lib/translation"
import { languages, getSpeechCodeFromLanguageCode } from "@/lib/languages"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Play, Trash, RotateCcw, Languages } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [sourceLang, setSourceLang] = useState("EN")
  const [targetLang, setTargetLang] = useState("ES")
  const { toast } = useToast()

  // Use a ref to track if we've already shown an error toast
  const errorShownRef = useRef({
    speech: false,
    synthesis: false,
  })

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({
    language: getSpeechCodeFromLanguageCode(sourceLang),
    onResult: (text) => {
      setSourceText(text)
    },
  })

  const {
    speak,
    cancel,
    isSpeaking,
    error: synthesisError,
  } = useSpeechSynthesis({
    onEnd: () => {
      toast({
        title: "Playback complete",
        description: "The translation has been spoken.",
      })
    },
    onError: (error) => {
      toast({
        title: "Playback error",
        description: "There was an error playing the translation.",
        variant: "destructive",
      })
    },
  })

  // Update source text when transcript changes - only if it's different
  useEffect(() => {
    if (transcript && transcript !== sourceText) {
      setSourceText(transcript)
    }
  }, [transcript, sourceText])

  // Handle translation
  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Empty text",
        description: "Please enter or speak some text to translate.",
        variant: "destructive",
      })
      return
    }

    setIsTranslating(true)
    try {
      const translated = await translateText(sourceText, targetLang)
      setTranslatedText(translated)
      toast({
        title: "Translation complete",
        description: "Your text has been translated successfully.",
      })
    } catch (error) {
      console.error("Translation error:", error)
      toast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }, [sourceText, targetLang, toast])

  // Handle speech playback
  const handleSpeak = useCallback(() => {
    if (!translatedText.trim()) {
      toast({
        title: "Empty translation",
        description: "Please translate some text first.",
        variant: "destructive",
      })
      return
    }

    speak(translatedText, getSpeechCodeFromLanguageCode(targetLang))
  }, [translatedText, targetLang, speak, toast])

  // Handle reset
  const handleReset = useCallback(() => {
    setSourceText("")
    setTranslatedText("")
    resetTranscript()
    cancel()
  }, [resetTranscript, cancel])

  // Display errors - but only once per error type
  useEffect(() => {
    if (speechError && !errorShownRef.current.speech) {
      toast({
        title: "Speech recognition error",
        description: speechError,
        variant: "destructive",
      })
      errorShownRef.current.speech = true
    }
  }, [speechError, toast])

  useEffect(() => {
    if (synthesisError && !errorShownRef.current.synthesis) {
      toast({
        title: "Speech synthesis error",
        description: synthesisError,
        variant: "destructive",
      })
      errorShownRef.current.synthesis = true
    }
  }, [synthesisError, toast])

  // Reset error flags when errors are cleared
  useEffect(() => {
    if (!speechError) {
      errorShownRef.current.speech = false
    }
    if (!synthesisError) {
      errorShownRef.current.synthesis = false
    }
  }, [speechError, synthesisError])

  // Handle source language change
  const handleSourceLangChange = useCallback((value: string) => {
    setSourceLang(value)
  }, [])

  // Handle target language change
  const handleTargetLangChange = useCallback((value: string) => {
    setTargetLang(value)
  }, [])

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-8">Voice Translation App</h1>

      <div className="grid gap-6">
        {/* Source Text Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Source Text</CardTitle>
              <Select value={sourceLang} onValueChange={handleSourceLangChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Speak or type text to translate..."
              className="min-h-[120px] resize-none"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isListening ? "Stop" : "Start"} Recording
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSourceText("")
                  resetTranscript()
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
            <Button onClick={handleTranslate} disabled={isTranslating || !sourceText.trim()}>
              <Languages className="mr-2 h-4 w-4" />
              {isTranslating ? "Translating..." : "Translate"}
            </Button>
          </CardFooter>
        </Card>

        {/* Translation Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Translation</CardTitle>
              <Select value={targetLang} onValueChange={handleTargetLangChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Translation will appear here..."
              className="min-h-[120px] resize-none"
              value={translatedText}
              readOnly
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleSpeak} disabled={isSpeaking || !translatedText.trim()}>
              <Play className="mr-2 h-4 w-4" />
              {isSpeaking ? "Speaking..." : "Speak Translation"}
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset All
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
