import { getMessage } from '@/shared/i18n/messages'
import { useTranslation } from '@/shared/i18n/use-translation'

type Assert<T extends true> = T

type IsExactlyString<T> = string extends T ? (T extends string ? true : false) : false

type MessageReturn = ReturnType<typeof getMessage>
type TranslationReturn = ReturnType<ReturnType<typeof useTranslation>['t']>

const messageReturnTypeMustBeString: Assert<IsExactlyString<MessageReturn>> = true
const translationReturnTypeMustBeString: Assert<IsExactlyString<TranslationReturn>> = true

void messageReturnTypeMustBeString
void translationReturnTypeMustBeString
