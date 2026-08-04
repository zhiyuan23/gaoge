import { ArrowUpRight } from 'lucide-react'

export default function LiveProjectButton() {
  return (
    <button
      className="border-mist text-mist hover:bg-mist/10 active:bg-mist/15 inline-flex items-center gap-2 whitespace-nowrap rounded-full border-2 px-8 py-3 text-sm font-medium uppercase tracking-widest transition-colors duration-200 sm:px-10 sm:py-3.5 sm:text-base"
      type="button"
    >
      <span>Live Project</span>
      <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
    </button>
  )
}
