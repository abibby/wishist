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

export interface ItemListEditProps {
    items: Item[] | undefined
}
export function ItemListEdit({ items }: ItemListEditProps) {
    const [newItem, setNewItem] = useState('')
    const [saving, setSaving] = useState(false)
    const [move, setMove] = useState<{ start: number; offset: number }>()

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

    if (items === undefined) {
        return <PageSpinner />
    }

    return (
        <ul class={classNames(styles.list, styles.edit)}>
            {/* <li>
                <pre>{JSON.stringify(move, undefined, '  ')}</pre>
            </li> */}
            {items.map((item, i) => (
                <Row
                    key={item.id}
                    class={classNames({
                        [styles.up]:
                            move &&
                            i > move.start &&
                            i < move.start + move.offset,
                        [styles.down]:
                            move &&
                            i < move.start &&
                            i > move.start + move.offset,
                    })}
                    item={item}
                    onMoving={bind(i, (i, offset) => {
                        setMove({ start: i, offset: offset })
                    })}
                    onMove={bind(i, (i, offset) => {
                        setMove(undefined)
                    })}
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
    onMoving?: (offset: number) => void
    onMove?: (offset: number) => void
}

function Row({ class: className, item, onMoving, onMove }: RowProps) {
    const openModal = useOpenModal()
    const [moving, setMoving] = useState(false)
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

    const dragStartPos = useRef<number>()
    const offsetIndex = useRef<number>(0)
    const lastOffsetIndex = useRef<number>(0)

    const dragStart = useCallback((e: MouseEvent) => {
        if (e.button !== 0) {
            return
        }
        setMoving(true)
        dragStartPos.current = e.y
    }, [])
    useWindowEvent(
        'mousemove',
        useCallback(
            (e: MouseEvent) => {
                if (
                    dragStartPos.current === undefined ||
                    liRef.current === null
                ) {
                    return
                }
                const offset = e.y - dragStartPos.current
                liRef.current.style.setProperty(
                    'transform',
                    `translate(0, ${offset}px)`,
                )
                const rect = liRef.current.getBoundingClientRect()
                offsetIndex.current = Math.round(offset / rect.height)
                if (offsetIndex.current !== lastOffsetIndex.current) {
                    onMoving?.(offsetIndex.current)
                    lastOffsetIndex.current = offsetIndex.current
                }
            },
            [onMoving],
        ),
    )
    useWindowEvent(
        'mouseup',
        useCallback(
            (_e: MouseEvent) => {
                if (dragStartPos.current === undefined) {
                    return
                }
                onMove?.(offsetIndex.current)
                setMoving(false)
                dragStartPos.current = undefined
                liRef.current?.style.removeProperty('transform')
                offsetIndex.current = 0
                lastOffsetIndex.current = 0
            },
            [onMove],
        ),
    )

    return (
        <li
            ref={liRef}
            class={classNames(className, { [styles.moving]: moving })}
        >
            <label class={styles.item}>
                <div class={styles.handle} onMouseDown={dragStart}>
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
