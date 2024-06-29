import { bind, bindValue } from '@zwzn/spicy'
import classNames from 'classnames'
import debounce from 'lodash.debounce'
import { h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { item, Item, UserItem, userItem } from '../api'
import { userID, useUser } from '../auth'
import styles from './item-list.module.css'
import { useFlash } from '../hooks/use-flash'
import { useOpenModal } from './modal'
import { Form } from './form/form'

h

const debouncedItemUpdate: typeof item.update = debounce(
    item.update,
    500,
) as typeof item.update

interface ListProps {
    items: Item[] | undefined
    userItems: UserItem[] | undefined
    readonly: boolean
}

export function ItemList({ items, userItems, readonly }: Readonly<ListProps>) {
    if (readonly) {
        return <ReadonlyList items={items} userItems={userItems} />
    }
    return <EditList items={items} />
}

interface ReadonlyListProps {
    items: Item[] | undefined
    userItems: UserItem[] | undefined
}
function ReadonlyList({ items, userItems }: ReadonlyListProps) {
    if (items === undefined) {
        return <div>loading...</div>
    }
    return (
        <ul class={styles.list}>
            {items.map(i => (
                <ReadonlyRow
                    key={i.id}
                    item={i}
                    userItem={userItems?.find(ui => ui.item_id === i.id)}
                />
            ))}
        </ul>
    )
}
interface EditListProps {
    items: Item[] | undefined
}
function EditList({ items }: EditListProps) {
    const [newItem, setNewItem] = useState('')

    const [flashInput, triggerFlashInput] = useFlash()
    const addItem = useCallback(async () => {
        if (newItem === '') {
            triggerFlashInput()
            return
        }
        await item.create({
            name: newItem,
            description: '',
            url: '',
        })
        setNewItem('')
    }, [newItem, triggerFlashInput])

    if (items === undefined) {
        return <div>loading...</div>
    }

    return (
        <ul class={classNames(styles.list, styles.edit)}>
            {items.map(i => (
                <Row key={i.id} item={i} />
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
                    />
                    <button>Add</button>
                </Form>
            </li>
        </ul>
    )
}

interface RowProps {
    item: Item
}

function Row({ item: item2 }: RowProps) {
    const openModal = useOpenModal()
    const remove = useCallback(async () => {
        await item.delete({ id: item2.id })
    }, [item2.id])

    const nameChange = useCallback(
        (value: string) => {
            if (value === '') {
                return
            }
            const newItem = {
                ...item2,
                name: value,
            }
            debouncedItemUpdate(newItem)
        },
        [item2],
    )
    return (
        <li>
            <label class={styles.item}>
                <input
                    class={styles.name}
                    type='text'
                    value={item2.name}
                    onInput={bindValue(nameChange)}
                />

                <div class={styles.actions}>
                    <button onClick={bind(`/item/${item2.id}/edit`, openModal)}>
                        +
                    </button>
                    <button onClick={remove}>x</button>
                </div>
            </label>
        </li>
    )
}

interface ReadonlyRowProps {
    item: Item
    userItem?: UserItem
}

function ReadonlyRow({ item, userItem: ui }: Readonly<ReadonlyRowProps>) {
    const openModal = useOpenModal()
    const user = useUser()

    const setType = useCallback(
        async (type: UserItem['type']) => {
            if (ui?.type === type) {
                await userItem.delete({ item_id: item.id })
                return
            }
            const uid = await userID()
            if (uid == undefined) {
                throw new Error('Must be logged in to update purchase state')
            }
            const newUserItem = {
                user_id: uid,
                item_id: item.id,
                type: type,
            }
            if (ui?.type !== undefined) {
                await userItem.update(newUserItem)
            } else {
                await userItem.create(newUserItem)
            }
        },
        [item.id, ui?.type],
    )
    const setThinking = useCallback(() => {
        setType('thinking')
    }, [setType])
    const setPurchased = useCallback(() => {
        setType('purchased')
    }, [setType])

    const isThinking = ui?.type === 'thinking'
    const isPurchased = ui?.type === 'purchased'

    const hasExtraInfo = item.url !== '' || item.description !== ''
    return (
        <li
            class={classNames(styles.item, {
                [styles.thinking]: (item.thinking_count ?? 0) > 0 || isThinking,
                [styles.purchased]:
                    (item.purchased_count ?? 0) > 0 || isPurchased,
            })}
        >
            <span
                class={styles.name}
                onClick={bind(`/item/${item.id}`, openModal)}
            >
                {item.name}
                {hasExtraInfo && ' *'}
            </span>
            {user && (
                <div class={styles.actions}>
                    <button
                        class={classNames(styles.action, {
                            [styles.active]: isThinking,
                        })}
                        onClick={setThinking}
                    >
                        👁️
                    </button>
                    <button
                        class={classNames(styles.action, {
                            [styles.active]: isPurchased,
                        })}
                        onClick={setPurchased}
                    >
                        🛍️
                    </button>
                </div>
            )}
        </li>
    )
}
