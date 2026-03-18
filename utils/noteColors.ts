import type { NoteColor } from '~/types/todo'

export const noteColors: Record<NoteColor, { bg: string; hover: string }> = {
  default: { bg: 'bg-gray-700', hover: 'lg:hover:bg-gray-900' },
  red: { bg: 'bg-[#3b1219]', hover: 'lg:hover:bg-[#1f080d]' },
  yellow: { bg: 'bg-[#3d3419]', hover: 'lg:hover:bg-[#1f1a0d]' },
  green: { bg: 'bg-[#1c3a2a]', hover: 'lg:hover:bg-[#0d1f16]' },
  purple: { bg: 'bg-[#3d1f3d]', hover: 'lg:hover:bg-[#1f0f1f]' },
}
