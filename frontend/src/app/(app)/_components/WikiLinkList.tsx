'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export interface WikiLinkListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface NoteItem {
  id: string
  title: string
}

interface Props {
  items: NoteItem[]
  command: (item: NoteItem) => void
}

export const WikiLinkList = forwardRef<WikiLinkListRef, Props>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }) {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) command(items[selectedIndex])
          return true
        }
        return false
      },
    }))

    useEffect(() => setSelectedIndex(0), [items])

    if (!items.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-md shadow-lg p-2 text-sm text-slate-400">
          일치하는 노트 없음
        </div>
      )
    }

    return (
      <div className="bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden min-w-[160px]">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => command(item)}
            className={`block w-full text-left px-3 py-1.5 text-sm ${
              index === selectedIndex
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-slate-50'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>
    )
  }
)

WikiLinkList.displayName = 'WikiLinkList'
