import type { NoteColor } from '~/types/todo'

type ColorSet = { bg: string; hover: string }

const dark: Record<NoteColor, ColorSet> = {
  default: { bg: 'bg-gray-700', hover: 'lg:hover:bg-gray-900' },
  red: { bg: 'bg-[#3b1219]', hover: 'lg:hover:bg-[#1f080d]' },
  yellow: { bg: 'bg-[#3d3419]', hover: 'lg:hover:bg-[#1f1a0d]' },
  green: { bg: 'bg-[#1c3a2a]', hover: 'lg:hover:bg-[#0d1f16]' },
  purple: { bg: 'bg-[#3d1f3d]', hover: 'lg:hover:bg-[#1f0f1f]' },
}

const light: Record<NoteColor, ColorSet> = {
  default: { bg: 'bg-gray-700', hover: 'lg:hover:bg-gray-900' },
  red: { bg: 'bg-[#FCE8E6]', hover: 'lg:hover:bg-[#F6D0CC]' },
  yellow: { bg: 'bg-[#FEF7E0]', hover: 'lg:hover:bg-[#FDEFC1]' },
  green: { bg: 'bg-[#E6F4EA]', hover: 'lg:hover:bg-[#CEEAD6]' },
  purple: { bg: 'bg-[#F3E8FD]', hover: 'lg:hover:bg-[#E8D0F5]' },
}

export const noteColorSets = { dark, light } as const

export const noteColors = dark
