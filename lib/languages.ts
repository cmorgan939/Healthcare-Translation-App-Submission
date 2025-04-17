export interface Language {
  code: string
  name: string
  speechCode?: string
}

export const languages: Language[] = [
  { code: "EN", name: "English", speechCode: "en-US" },
  { code: "ES", name: "Spanish", speechCode: "es-ES" },
  { code: "FR", name: "French", speechCode: "fr-FR" },
  { code: "DE", name: "German", speechCode: "de-DE" },
  { code: "IT", name: "Italian", speechCode: "it-IT" },
  { code: "JA", name: "Japanese", speechCode: "ja-JP" },
  { code: "ZH", name: "Chinese", speechCode: "zh-CN" },
  { code: "RU", name: "Russian", speechCode: "ru-RU" },
  { code: "PT", name: "Portuguese", speechCode: "pt-PT" },
  { code: "AR", name: "Arabic", speechCode: "ar-SA" },
]

export function getLanguageByCode(code: string): Language {
  return languages.find((lang) => lang.code === code) || languages[0]
}

export function getSpeechCodeFromLanguageCode(code: string): string {
  const language = getLanguageByCode(code)
  return language.speechCode || "en-US"
}
