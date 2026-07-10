import type { Locale } from '../i18n'

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

import { LOCALES } from '../i18n'

export type TranslatableFields = {
  description: string
  title: string
}

export type DocumentTranslation = {
  lang: Locale
  translations: Partial<Record<Locale, TranslatableFields>>
}

export type TranslateDocumentInput = {
  apiKey: string
  sourceLocaleHint: Locale
  texts: TranslatableFields
}

const MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 4096

const GLOSSARY = `жилой комплекс (ЖК) | тұрғын үй кешені | residential complex
КСК (кооператив собственников квартир) | пәтер иелерінің кооперативі | homeowners cooperative (KSK)
управляющая компания (УК) | басқарушы компания | management company
подъезд | кіреберіс | entrance
блок | блок | block
квартира | пәтер | apartment
паркинг | паркинг | parking
мусоропровод | қоқыс құбыры | garbage chute
домофон | домофон | intercom
лифт | лифт | elevator
двор | аула | courtyard
шлагбаум | шлагбаум | barrier gate
коммунальные услуги | коммуналдық қызметтер | utilities
показания счётчиков | есептегіш көрсеткіштері | meter readings
отключение воды | суды өшіру | water shutoff
отопление | жылыту | heating
детская площадка | балалар алаңы | playground
заявка | өтінім | issue`

const fieldsSchema = z.object({
  description: z.string().min(1),
  title: z.string().min(1),
})

const outputSchema = z.object({
  detectedLang: z.enum(LOCALES),
  translations: z.object({
    en: fieldsSchema.optional(),
    kk: fieldsSchema.optional(),
    ru: fieldsSchema.optional(),
  }),
})

const systemPrompt = (
  sourceLocaleHint: Locale,
) => `You translate resident-generated content for a residential-complex community app in Kazakhstan.
Supported languages: Russian (ru), Kazakh (kk), English (en).
Detect the source language of the content, then translate its title and description into the two other supported languages, keyed by locale under "translations". Do not include the detected source language under "translations".
The author's app locale is "${sourceLocaleHint}" — a hint only; detect the actual language from the text itself.
Preserve the tone and register of the original; keep numbers, addresses, prices, emoji, and line breaks intact; do not add or omit information.
Use this domain glossary (ru | kk | en):
${GLOSSARY}`

export const translateDocument = async ({
  apiKey,
  sourceLocaleHint,
  texts,
}: TranslateDocumentInput): Promise<DocumentTranslation | null> => {
  const client = new Anthropic({ apiKey })
  const message = await client.messages.parse({
    max_tokens: MAX_TOKENS,
    messages: [{ content: JSON.stringify(texts), role: 'user' }],
    model: MODEL,
    output_config: { format: zodOutputFormat(outputSchema) },
    system: systemPrompt(sourceLocaleHint),
    temperature: 0,
  })
  const parsed = message.parsed_output
  if (!parsed) return null
  const targets = LOCALES.filter(locale => locale !== parsed.detectedLang)
  const entries = targets.flatMap(locale => {
    const fields = parsed.translations[locale]
    return fields ? [[locale, fields] as const] : []
  })
  if (entries.length !== targets.length) return null
  return {
    lang: parsed.detectedLang,
    translations: Object.fromEntries(entries),
  }
}
