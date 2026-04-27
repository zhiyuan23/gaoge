import type { SearchOption } from '@/components/common/EsSearch/types'

export function createPlayerOptionList(values: Array<string | null | undefined>): SearchOption[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim()))),
  ).map((value) => ({
    label: value,
    value,
  }))
}

export function mergePlayerStatusOptions(
  baseOptions: SearchOption[],
  dynamicOptions: SearchOption[],
): SearchOption[] {
  const options = [...baseOptions]

  dynamicOptions.forEach((item) => {
    if (!options.some((option) => option.value === item.value)) {
      options.push(item)
    }
  })

  return options
}
