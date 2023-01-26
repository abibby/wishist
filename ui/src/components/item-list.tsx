import { bind, bindValue } from '@zwzn/spicy'
import classNames from 'classnames'
import debounce from 'lodash.debounce'
import { h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { item, Item, UserItem, userItem } from '../api'
import { userID } from '../auth'
import styles from './item-list.module.css'

h

const debouncedItemUpdate: typeof item.update = debounce(
    item.update,
    500,
) as any

interface ListProps {
    username: string
    readonly: boolean
}

export function ItemList({ username: name, readonly }: ListProps) {
    const [newItem, setNewItem] = useState('')
    const [items, setItems] = useState<Item[] | undefined>()
    const [userItems, setUserItems] = useState<UserItem[] | undefined>()

    useEffect(() => {
        item.list({ user: name })
            .then(setItems)
            .catch(() => setItems(undefined))
        userItem
            .list({ user: name })
            .then(setUserItems)
            .catch(() => setUserItems(undefined))
    }, [name])

    const addItem = useCallback(async () => {
        const createdItem = await item.create({
            name: newItem,
            description: '',
            url: '',
        })
        setItems(i => i?.concat([createdItem]))
        setNewItem('')
    }, [newItem, setNewItem, setItems])

    const removeItem = useCallback(
        async (id: number) => {
            await item.delete({
                id: id,
            })
            setItems(items => items?.filter(i => i.id !== id))
        },
        [setItems],
    )

    const newItemKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                addItem()
            }
        },
        [addItem],
    )

    const listChange = useCallback(
        (item: Item) => {
            setItems(items =>
                items?.map(i => {
                    if (i.id === item.id) {
                        return item
                    }
                    return i
                }),
            )
            debouncedItemUpdate(item)
        },
        [setItems],
    )

    const userItemCreate = useCallback(
        (newUserItem: UserItem) => {
            setUserItems(userItems => userItems?.concat([newUserItem]))
        },
        [setUserItems],
    )
    const userItemChange = useCallback(
        (updatedUserItem: UserItem) => {
            setUserItems(userItems =>
                userItems?.map(ui => {
                    if (ui.item_id === updatedUserItem.item_id) {
                        return updatedUserItem
                    }
                    return ui
                }),
            )
        },
        [setUserItems],
    )
    const userItemRemove = useCallback(
        (itemID: number) => {
            setUserItems(userItems =>
                userItems?.filter(ui => ui.item_id !== itemID),
            )
        },
        [setUserItems],
    )

    if (items === undefined) {
        return <div>loading...</div>
    }

    return (
        <ul class={styles.list}>
            {items.map(i => {
                if (readonly) {
                    return (
                        <ReadonlyRow
                            key={i.id}
                            item={i}
                            userItem={userItems?.find(
                                ui => ui.item_id === i.id,
                            )}
                            onUserItemCreate={userItemCreate}
                            onUserItemChange={userItemChange}
                            onUserItemRemove={userItemRemove}
                        />
                    )
                } else {
                    return (
                        <Row
                            key={i.id}
                            item={i}
                            onChange={listChange}
                            onRemove={removeItem}
                        />
                    )
                }
            })}
            {!readonly && (
                <li class={classNames(styles.item, styles.new)}>
                    <input
                        class={styles.name}
                        type='text'
                        value={newItem}
                        onInput={bindValue(setNewItem)}
                        onKeyDown={newItemKeyDown}
                    />
                    <button onClick={addItem}>Add</button>
                </li>
            )}
        </ul>
    )
}

interface RowProps {
    item: Item
    onChange: (item: Item) => void
    onRemove: (id: number) => void
}

function Row({ item, onChange, onRemove }: RowProps) {
    const [open, setOpen] = useState(false)

    const edit = useCallback(
        (field: keyof Item, value: string) => {
            onChange({
                ...item,
                [field]: value,
            })
        },
        [item, onChange],
    )

    return (
        <li>
            <label class={styles.item}>
                <input
                    class={styles.name}
                    type='text'
                    value={item.name}
                    onInput={bindValue(bind('name', edit))}
                />

                <div class={styles.actions}>
                    <button onClick={bind(true, setOpen)}>+</button>
                    <button onClick={bind(item.id, onRemove)}>x</button>
                </div>
                <div
                    class={classNames(styles.screen, { [styles.open]: open })}
                    onClick={bind(false, setOpen)}
                />
            </label>
            <div class={classNames(styles.popup, { [styles.open]: open })}>
                <label>
                    Name:{' '}
                    <input
                        type='text'
                        value={item.name}
                        onInput={bindValue(bind('name', edit))}
                    />
                </label>
                <label>
                    URL:{' '}
                    <input
                        type='text'
                        value={item.url}
                        onInput={bindValue(bind('url', edit))}
                    />
                </label>
                <label>
                    Description:{' '}
                    <input
                        type='text'
                        value={item.description}
                        onInput={bindValue(bind('description', edit))}
                    />
                </label>
                <div>
                    <button onClick={bind(false, setOpen)}>Save</button>
                </div>
            </div>
        </li>
    )
}

interface ReadonlyRowProps {
    item: Item
    userItem?: UserItem
    onUserItemCreate: (userItem: UserItem) => void
    onUserItemChange: (userItem: UserItem) => void
    onUserItemRemove: (itemID: number) => void
}

function ReadonlyRow({
    item,
    userItem: ui,
    onUserItemCreate,
    onUserItemChange,
    onUserItemRemove,
}: ReadonlyRowProps) {
    const [open, setOpen] = useState(false)

    const itemID = item.id
    const userItemType = ui?.type
    const hasUserItem = ui !== undefined
    const setType = useCallback(
        async (type: UserItem['type']) => {
            if (userItemType === type) {
                onUserItemRemove(itemID)
                await userItem.delete({ item_id: itemID })
                return
            }
            const uid = await userID()
            const newUserItem = {
                user_id: uid ?? 0,
                item_id: itemID,
                type: type,
            }
            if (hasUserItem) {
                onUserItemChange(newUserItem)
                await userItem.update(newUserItem)
            } else {
                onUserItemCreate(newUserItem)
                await userItem.create(newUserItem)
            }
        },
        [hasUserItem, itemID, userItemType],
    )
    const setThinking = useCallback(() => {
        setType('thinking')
    }, [setType])
    const setPurchased = useCallback(() => {
        setType('purchased')
    }, [setType])

    const isThinking = ui?.type === 'thinking'
    const isPurchased = ui?.type === 'purchased'

    let host: string | undefined
    try {
        host = new URL(item.url).host
    } catch (e) {}

    const hasExtraInfo = item.url !== '' || item.description !== ''
    return (
        <li
            class={classNames(styles.item, {
                [styles.thinking]: (item.thinking_count ?? 0) > 0,
                [styles.purchased]: (item.purchased_count ?? 0) > 0,
            })}
        >
            <span
                class={styles.name}
                onClick={hasExtraInfo ? bind(true, setOpen) : undefined}
            >
                {item.name}
                {hasExtraInfo && ' *'}
            </span>
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
            <div
                class={classNames(styles.screen, { [styles.open]: open })}
                onClick={bind(false, setOpen)}
            />
            <div class={classNames(styles.popup, { [styles.open]: open })}>
                <div>Name: {item.name}</div>
                <div>
                    URL:{' '}
                    {host ? (
                        <a href={item.url} target='_blank'>
                            {host}
                        </a>
                    ) : (
                        item.url
                    )}
                </div>
                <div>Description: {item.description}</div>
            </div>
        </li>
    )
}
