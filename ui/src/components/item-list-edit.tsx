import { bind, bindValue } from '@zwzn/spicy'
import classNames from 'classnames'
import debounce from 'lodash.debounce'
import { h } from 'preact'
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { itemAPI, Item } from '../api'
import styles from './item-list.module.css'
import { useFlash } from '../hooks/use-flash'
import { useOpenModal } from './modal'
import { Form } from './form/form'
import { PageSpinner, Spinner } from './spinner'
import { openToast } from './toast'
import { sleep } from '../utils'
import { useWindowEvent } from '../hooks/use-window-event'

type Moving = {
    element: HTMLElement
    startY: number
    index: number
    item: Item
}

export interface ItemListEditProps {
    items: Item[] | undefined
    onMoveItem: (item: Item, newOrder: number) => void
}
export function ItemListEdit({ items, onMoveItem }: ItemListEditProps) {
    const [newItem, setNewItem] = useState('')
    const [saving, setSaving] = useState(false)
    const [move, setMove] = useState<{ start: number; offset: number }>()
    const [noAnimation, setNoAnimation] = useState(false)

    const [flashInput, triggerFlashInput] = useFlash()
    const addItem = useCallback(async () => {
        if (newItem === '') {
            triggerFlashInput()
            return
        }
        setSaving(true)
        try {
            await itemAPI.create({
                name: newItem,
                description: '',
                url: '',
                price: null,
                order: -1,
            })
        } catch (e) {
            console.warn(e)

            openToast('Could not add item, try again later')
            return
        } finally {
            setSaving(false)
        }
        setNewItem('')
    }, [newItem, triggerFlashInput])

    const offsetIndex = useRef<number>(0)
    const lastOffsetIndex = useRef<number>(0)

    const moving = useRef<Moving>(null)

    const startMove = useCallback(
        (index: number, item: Item, startY: number, li: HTMLElement) => {
            moving.current = {
                element: li,
                startY: startY,
                index: index,
                item: item,
            }
            li.classList.add(styles.moving)

            setMove({
                start: index,
                offset: 0,
            })
        },
        [],
    )
    const mouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        const event = normalizeEvent(e)
        if (moving.current === null) {
            return
        }
        const offset = event.y - moving.current.startY
        moving.current.element.style.setProperty(
            'transform',
            `translate(0, ${offset}px)`,
        )
        const rect = moving.current.element.getBoundingClientRect()
        offsetIndex.current = Math.round(offset / rect.height)
        if (offsetIndex.current !== lastOffsetIndex.current) {
            lastOffsetIndex.current = offsetIndex.current
            setMove(m => {
                if (!m) return
                return {
                    ...m,
                    offset: offsetIndex.current,
                }
            })
        }
    }, [])

    const mouseUp = useCallback(() => {
        if (moving.current === null) {
            return
        }
        if (offsetIndex.current !== 0) {
            setNoAnimation(true)
            setTimeout(() => {
                setNoAnimation(false)
            }, 10)
            onMoveItem(
                moving.current.item,
                moving.current.index + offsetIndex.current,
            )
        }
        moving.current.element.classList.remove(styles.moving)
        moving.current.element.style.removeProperty('transform')

        offsetIndex.current = 0
        lastOffsetIndex.current = 0
        moving.current = null
        setMove(undefined)
    }, [onMoveItem])

    useWindowEvent('mousemove', mouseMove)
    useWindowEvent('touchmove', mouseMove)
    useWindowEvent('mouseup', mouseUp)
    useWindowEvent('touchend', mouseUp)

    if (items === undefined) {
        return <PageSpinner />
    }

    return (
        <ul
            class={classNames(styles.list, styles.edit, {
                [styles.noAnimation]: noAnimation,
            })}
        >
            {items.map((item, i) => (
                <Row
                    key={item.id}
                    class={classNames({
                        [styles.up]:
                            move &&
                            i > move.start &&
                            i <= move.start + move.offset,
                        [styles.down]:
                            move &&
                            i < move.start &&
                            i >= move.start + move.offset,
                    })}
                    item={item}
                    onStartMove={bind(i, item, startMove)}
                />
            ))}
            <li>
                <Form
                    class={classNames(styles.item, styles.new, {
                        [styles.flashInput]: flashInput,
                    })}
                    onSubmit={addItem}
                >
                    <input
                        class={styles.name}
                        type='text'
                        value={newItem}
                        onInput={bindValue(setNewItem)}
                        disabled={saving}
                        autocomplete='off'
                    />
                    {saving && <Spinner />}
                    <button class='light' disabled={saving}>
                        Add
                    </button>
                </Form>
            </li>
        </ul>
    )
}

interface RowProps {
    item: Item
    class?: string
    onStartMove?: (startY: number, element: HTMLLIElement) => void
}

function Row({ class: className, item, onStartMove }: RowProps) {
    const openModal = useOpenModal()
    const [saving, setSaving] = useState<
        'ready' | 'waiting' | 'saving' | 'saved' | 'failed'
    >('ready')
    const [name, setName] = useState(item.name)
    const debouncedItemUpdate = useMemo(() => {
        return debounce(async (request: Omit<Item, 'user_id'>) => {
            setSaving('saving')
            try {
                await itemAPI.update(request)
                setSaving('saved')
                await sleep(500)
                setSaving('ready')
            } catch {
                setSaving('failed')
            }
        }, 500)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.id])

    useEffect(() => setName(item.name), [item.name])

    const nameChange = useCallback(
        (value: string) => {
            setName(value)
            if (value === '') {
                return
            }
            setSaving('waiting')
            const newItem = {
                ...item,
                name: value,
            }
            debouncedItemUpdate(newItem)
        },
        [debouncedItemUpdate, item],
    )

    const liRef = useRef<HTMLLIElement | null>(null)

    const mouseDown = useCallback(
        (e: MouseEvent | TouchEvent) => {
            e.preventDefault()
            const event = normalizeEvent(e)
            if (!event.primaryAction || !liRef.current) {
                return
            }
            onStartMove?.(event.y, liRef.current)
        },
        [onStartMove],
    )

    return (
        <li ref={liRef} class={className}>
            <label class={styles.item}>
                <div
                    class={styles.handle}
                    onMouseDown={mouseDown}
                    onTouchStart={mouseDown}
                >
                    ⠿
                </div>
                <input
                    class={styles.name}
                    type='text'
                    value={name}
                    name='title'
                    onInput={bindValue(nameChange)}
                    autocomplete='off'
                />
                {saving !== 'ready' && (
                    <Spinner
                        done={saving === 'saved'}
                        failed={saving === 'failed'}
                    />
                )}
                <div class={styles.actions}>
                    <button onClick={bind(`/item/${item.id}/edit`, openModal)}>
                        +
                    </button>
                </div>
            </label>
        </li>
    )
}

type NormalizedEvent = {
    primaryAction: boolean
    x: number
    y: number
}

function normalizeEvent(e: TouchEvent | MouseEvent): NormalizedEvent {
    if (e instanceof TouchEvent) {
        return {
            primaryAction: e.touches.length === 1,
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        }
    }

    if (e instanceof MouseEvent) {
        return {
            primaryAction: e.button === 0,
            x: e.x,
            y: e.y,
        }
    }

    throw new Error(`unexpected type`)
}
