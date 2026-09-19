import { cookies } from 'next/headers'
import es from '@/locales/es'
import en from '@/locales/en'

export type Locale = 'es' | 'en'

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const locale = store.get('locale')?.value
  return locale === 'en' ? 'en' : 'es'
}

export async function getTranslations() {
  const locale = await getLocale()
  return locale === 'en' ? en : es
}

export { es, en }
