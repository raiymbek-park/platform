import type { IssueStatus } from '@raiymbek-park/shared/validation-schemas'

export const LOCALES = ['ru', 'kk', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

const isLocale = (value: string): value is Locale =>
  LOCALES.some(locale => locale === value)

export const resolveLocale = (value: string | string[] | undefined): Locale => {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && isLocale(raw) ? raw : DEFAULT_LOCALE
}

const messages = {
  phoneNotVerified: {
    ru: 'Телефон не подтверждён',
    kk: 'Телефон расталмаған',
    en: 'Phone is not verified',
  },
  tooManyRequests: {
    ru: 'Слишком много попыток. Попробуйте позже',
    kk: 'Әрекеттер тым көп. Кейінірек қайталап көріңіз',
    en: 'Too many attempts. Try again later',
  },
  invalidCode: {
    ru: 'Неверный или просроченный код',
    kk: 'Код қате немесе мерзімі өткен',
    en: 'Invalid or expired code',
  },
  smsSendFailed: {
    ru: 'Не удалось отправить SMS. Попробуйте позже',
    kk: 'SMS жіберілмеді. Кейінірек қайталап көріңіз',
    en: 'Failed to send the SMS. Try again later',
  },
  reactionForbidden: {
    ru: 'Недостаточно прав для реакции',
    kk: 'Реакция қою құқығы жеткіліксіз',
    en: 'Not allowed to react',
  },
  issueNotFound: {
    ru: 'Заявка не найдена',
    kk: 'Өтінім табылмады',
    en: 'Issue not found',
  },
  issueCreateForbidden: {
    ru: 'Недостаточно прав для создания заявки',
    kk: 'Өтінім жасауға құқық жеткіліксіз',
    en: 'Not allowed to open an issue',
  },
  issueDeleteForbidden: {
    ru: 'Заявку нельзя удалить',
    kk: 'Өтінімді жоюға болмайды',
    en: 'This issue cannot be deleted',
  },
  issueUpdateForbidden: {
    ru: 'Заявку нельзя изменить',
    kk: 'Өтінімді өзгертуге болмайды',
    en: 'This issue cannot be edited',
  },
  statusChangeForbidden: {
    ru: 'Недостаточно прав для смены статуса',
    kk: 'Мәртебені өзгертуге құқық жеткіліксіз',
    en: 'Not allowed to change the status',
  },
} satisfies Record<string, Record<Locale, string>>

const isMessageKey = (key: string): key is keyof typeof messages =>
  Object.hasOwn(messages, key)

export const translate = (locale: Locale, message: string): string =>
  isMessageKey(message) ? messages[message][locale] : message

const otpSmsLabel = {
  ru: 'код подтверждения',
  kk: 'растау коды',
  en: 'verification code',
} satisfies Record<Locale, string>

export const otpSmsText = (locale: Locale, code: string): string =>
  `Raiymbek Park: ${otpSmsLabel[locale]} ${code}`

export const digestTitle = {
  ru: 'Новое в Raiymbek Park',
  kk: 'Raiymbek Park жаңалықтары',
  en: 'New in Raiymbek Park',
} satisfies Record<Locale, string>

const issueStatusLabel = {
  new: { ru: 'Новая', kk: 'Жаңа', en: 'New' },
  'in-progress': { ru: 'В работе', kk: 'Жұмыста', en: 'In progress' },
  planned: { ru: 'Запланировано', kk: 'Жоспарланған', en: 'Planned' },
  blocked: { ru: 'Заблокировано', kk: 'Бұғатталған', en: 'Blocked' },
  'resident-review': {
    ru: 'На рассмотрении жильцов',
    kk: 'Тұрғындар қарауында',
    en: 'Under resident review',
  },
  done: { ru: 'Выполнено', kk: 'Орындалды', en: 'Done' },
  rejected: { ru: 'Отклонено', kk: 'Қабылданбады', en: 'Rejected' },
} satisfies Record<IssueStatus, Record<Locale, string>>

export const issueStatusHeadline = {
  ru: (number: number, status: IssueStatus) =>
    `Заявка №${number}: ${issueStatusLabel[status].ru}`,
  kk: (number: number, status: IssueStatus) =>
    `Өтінім №${number}: ${issueStatusLabel[status].kk}`,
  en: (number: number, status: IssueStatus) =>
    `Issue #${number}: ${issueStatusLabel[status].en}`,
} satisfies Record<Locale, (number: number, status: IssueStatus) => string>

export const issueCommentHeadline = {
  ru: (number: number) => `Новые сообщения по заявке №${number}`,
  kk: (number: number) => `№${number} өтінім бойынша жаңа хабарламалар`,
  en: (number: number) => `New messages on issue #${number}`,
} satisfies Record<Locale, (number: number) => string>

export const digestRemainder = {
  ru: (count: number) => `и ещё ${count}`,
  kk: (count: number) => `және тағы ${count}`,
  en: (count: number) => `and ${count} more`,
} satisfies Record<Locale, (count: number) => string>
