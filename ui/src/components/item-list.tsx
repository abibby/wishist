import { bind, bindValue } from '@zwzn/spicy'
import classNames from 'classnames'
import debounce from 'lodash.debounce'
import { Fragment, h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { item, Item, UserItem, userItem } from '../api'
import { userID, useUser } from '../auth'
import { Input } from './form/input'
import styles from './item-list.module.css'
import { TextArea } from './form/textarea'
import { FetchError } from '../api/internal'

h

const debouncedItemUpdate: typeof item.update = debounce(
    item.update,
    500,
) as typeof item.update

interface ListProps {
    username: string
    readonly: boolean
    onFetchError: (err: FetchError<unknown> | undefined) => void
}

export function ItemList({
    username: name,
    readonly,
    onFetchError,
}: Readonly<ListProps>) {
    const [newItem, setNewItem] = useState('')
    const [items, setItems] = useState<Item[] | undefined>()
    const [userItems, setUserItems] = useState<UserItem[] | undefined>()
    const { id: userID } = useUser() ?? {}

    useEffect(() => {
        onFetchError(undefined)
        item.list({ user: name })
            .then(setItems)
            .catch(e => {
                if (e instanceof FetchError) {
                    onFetchError(e)
                }
                setItems(undefined)
            })
        if (userID !== undefined) {
            userItem
                .list({ user: name })
                .then(setUserItems)
                .catch(e => {
                    if (e instanceof FetchError) {
                        if (e.status !== 401) {
                            onFetchError(e)
                        }
                    }
                    setUserItems(undefined)
                })
        } else {
            setUserItems(undefined)
        }
    }, [name, userID, onFetchError])

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
        <ul class={classNames(styles.list, { [styles.edit]: !readonly })}>
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
                <Input
                    title='Name'
                    value={item.name}
                    onInput={bind('name', edit)}
                />
                <Input
                    title='URL'
                    value={item.url}
                    onInput={bind('url', edit)}
                />
                <TextArea
                    title='Description'
                    value={item.description}
                    onInput={bind('description', edit)}
                />
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
}: Readonly<ReadonlyRowProps>) {
    const [open, setOpen] = useState(false)
    const user = useUser()

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
        [
            hasUserItem,
            itemID,
            userItemType,
            onUserItemCreate,
            onUserItemChange,
            onUserItemRemove,
        ],
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
            <span class={styles.name} onClick={bind(true, setOpen)}>
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
            <div
                class={classNames(styles.screen, { [styles.open]: open })}
                onClick={bind(false, setOpen)}
            />
            <ItemPopup
                item={item}
                open={open}
                isThinking={isThinking}
                isPurchased={isPurchased}
            />
        </li>
    )
}

type ItemPopupProps = {
    item: Item
    open: boolean
    isThinking: boolean
    isPurchased: boolean
}
function ItemPopup({ item, open, isThinking, isPurchased }: ItemPopupProps) {
    return (
        <div
            class={classNames(styles.popup, styles.readonly, {
                [styles.open]: open,
            })}
        >
            <h3 class={styles.popupName}>{item.name}</h3>
            {item.url !== '' && (
                <div class={styles.popupLink}>
                    <ItemLink url={item.url} />
                </div>
            )}
            {item.description && (
                <div
                    class={classNames(styles.popupDescription, styles.divider)}
                >
                    {item.description.split('\n').map(line => (
                        <p>{line}</p>
                    ))}
                </div>
            )}
            {(item.thinking_count !== undefined ||
                item.purchased_count !== undefined) && (
                <>
                    <div class={styles.divider}>
                        Watching:{' '}
                        {formatCount(isThinking, item.thinking_count ?? 0)}
                    </div>
                    <div>
                        Purchased:{' '}
                        {formatCount(isPurchased, item.purchased_count ?? 0)}
                    </div>
                </>
            )}
        </div>
    )
}

function ItemLink({ url }: { url: string }) {
    let host: string | undefined
    if (url !== undefined && url !== '') {
        try {
            host = new URL(url).host
        } catch (_e) {
            // intentionally empty
        }
    }

    if (host === undefined) {
        return <Fragment>{url}</Fragment>
    }
    return (
        <a href={url} target='_blank'>
            {host}
        </a>
    )
}
function formatCount(you: boolean, count: number): string {
    if (you && count === 0) {
        if (count === 0) {
            return 'Only you'
        } else {
            return 'You + ' + count
        }
    }

    return String(count)
}
