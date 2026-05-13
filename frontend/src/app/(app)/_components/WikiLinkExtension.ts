import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { WikiLinkList, WikiLinkListRef } from './WikiLinkList'
import type { MutableRefObject } from 'react'

interface NoteItem {
  id: string
  title: string
}

export function createWikiLinkExtension(notesRef: MutableRefObject<NoteItem[]>) {
  return Extension.create({
    name: 'wikilink',

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: '[[',
          items: ({ query }: { query: string }) =>
            notesRef.current
              .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 8),

          render: () => {
            let component: ReactRenderer<WikiLinkListRef>
            let popup: TippyInstance[]

            return {
              onStart: (props) => {
                component = new ReactRenderer(WikiLinkList, {
                  props,
                  editor: props.editor,
                })
                if (!props.clientRect) return
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },
              onUpdate: (props) => {
                component.updateProps(props)
                if (!props.clientRect) return
                popup[0].setProps({ getReferenceClientRect: props.clientRect as () => DOMRect })
              },
              onKeyDown: (props) => {
                if (props.event.key === 'Escape') { popup[0]?.hide(); return true }
                return component.ref?.onKeyDown(props) ?? false
              },
              onExit: () => { popup[0]?.destroy(); component.destroy() },
            }
          },

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          command: ({ editor, range, props }: { editor: any; range: any; props: NoteItem }) => {
            editor.chain().focus().deleteRange(range).insertContent(`[[${props.title}]]`).run()
          },
        }),
      ]
    },
  })
}
