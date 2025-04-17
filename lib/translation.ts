export interface TranslationResponse {
  translations: {
    detected_source_language: string
    text: string
  }[]
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, targetLang }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Translation failed")
    }

    const data: TranslationResponse = await response.json()
    return data.translations[0].text
  } catch (error) {
    console.error("Translation error:", error)
    throw error
  }
}
