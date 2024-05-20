import classNames from 'classnames'
import { RenderableProps, h } from 'preact'
import { useCallback, useRef, useState } from 'preact/hooks'

h

type State = {
    originalPosition: [number, number]
    moving: HTMLElement
    children: {
        element: HTMLElement
        pos: [number, number]
    }[]
}

export interface OrderableListProps {
    class?: string
    onMove?: (newIndex: number, oldIndex: number) => void
}

export function OrderableList({
    children,
    class: className,
    onMove,
}: RenderableProps<OrderableListProps>) {
    const root = useRef<HTMLUListElement | null>(null)
    const state = useRef<State>()

    const handleDown = useCallback((e: MouseEvent) => {
        if (root.current === null) {
            return
        }

        if (!(e.target instanceof HTMLElement)) {
            console.warn('not an element')
            return
        }

        let current: HTMLElement = e.target
        while (current.parentElement !== root.current) {
            if (current.parentElement === null) {
                console.warn('not a child')

                return
            }
            current = current.parentElement
        }

        const movableChildren = htmlChildren(root.current)
        state.current = {
            originalPosition: [e.x, e.y],
            moving: current,
            children: movableChildren.map(c => {
                const rect = c.getBoundingClientRect()
                return {
                    element: c,
                    pos: [rect.x, rect.y],
                }
            }),
        }
    }, [])

    const handleUp = useCallback((e: MouseEvent) => {
        if (state.current === undefined) {
            return
        }
        const moving = state.current.moving
        let last: HTMLElement | undefined
        let i = 0
        for (const { element, pos } of state.current.children) {
            if (element === moving) {
                i++
                continue
            }

            const rect = element.getBoundingClientRect()

            if (pos[1] < e.y && e.y < pos[1] + rect.height) {
                // if (e.y < pos[1]) {
                onMove?.(
                    i,
                    state.current.children.findIndex(c => c.element === moving),
                )

                break
            }

            last = element
            i++
        }
        for (const { element } of state.current.children) {
            element.style.transform = ''
            element.style.transition = ''
        }

        state.current = undefined
    }, [])

    const handleMove = useCallback((e: MouseEvent) => {
        if (state.current === undefined || root.current === null) {
            return
        }
        const [ox, oy] = state.current.originalPosition
        const x = e.x - ox
        const y = e.y - oy

        const moving = state.current.moving

        moving.style.transform = `translate(${x}px, ${y}px)`

        for (const { element, pos } of state.current.children) {
            if (element === moving) {
                continue
            }
            const rect = element.getBoundingClientRect()
            element.style.transition = `transform 100ms`
            if (pos[1] < oy) {
                if (pos[1] + rect.height > e.y) {
                    element.style.transform = `translate(0px, 100%)`
                } else {
                    element.style.transform = `translate(0px, 0px)`
                }
            } else {
                if (pos[1] < e.y) {
                    element.style.transform = `translate(0px, -100%)`
                } else {
                    element.style.transform = `translate(0px, 0px)`
                }
            }
        }
    }, [])

    return (
        <ul
            class={classNames(className)}
            ref={root}
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
        >
            {children}
        </ul>
    )
}

function htmlChildren(e: HTMLElement): HTMLElement[] {
    return Array.from(e.children).filter(
        (e): e is HTMLElement => e instanceof HTMLElement,
    )
}
