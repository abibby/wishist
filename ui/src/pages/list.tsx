import { bind, bindValue } from '@zwzn/spicy'
import debounce from 'lodash.debounce'
import { h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { Item, list, listAdd, listEdit, listRemove } from '../api/list'
import { userID, username } from '../auth'

h

const debouncedListEdit: typeof listEdit = debounce(listEdit, 500) as any

interface ListProps {
    matches: {
        name: string
    }
}

export function List({ matches }: ListProps) {
    const [newItem, setNewItem] = useState('')
    const [items, setItems] = useState<Item[] | undefined>()
    const [readonly, setReadonly] = useState(true)
    const { name } = matches

    useEffect(() => {
        list({ user: name })
            .then(setItems)
            .catch(() => setItems(undefined))
    }, [name])
    useEffect(() => {
        username().then(user => {
            setReadonly(user !== name)
        })
    }, [name])
    const addItem = useCallback(async () => {
        const uid = await userID()
        if (uid === undefined) {
            console.warn('could not add item, not logged in')

            return
        }
        const createdItem = await listAdd({
            user_id: uid,
            name: newItem,
            description: '',
            url: '',
        })
        setItems(i => i?.concat([createdItem]))
        setNewItem('')
    }, [newItem, setNewItem, setItems])

    const removeItem = useCallback(
        async (id: number) => {
            await listRemove({
                item_id: id,
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

    if (items === undefined) {
        return <div>loading...</div>
    }

    return (
        <div>
            <ul>
                {items.map(i => (
                    <ListItem
                        key={i.id}
                        item={i}
                        readonly={readonly}
                        onEdit={debouncedListEdit}
                        onRemove={removeItem}
                    />
                ))}
                {!readonly && (
                    <li>
                        <input
                            type='text'
                            value={newItem}
                            onInput={bindValue(setNewItem)}
                            onKeyDown={newItemKeyDown}
                        />
                        <button onClick={addItem}>Add</button>
                    </li>
                )}
            </ul>
        </div>
    )
}

interface ListItemProps {
    item: Item
    readonly: boolean
    onEdit: (item: Item) => void
    onRemove: (id: number) => void
}

function ListItem({ item, readonly, onEdit, onRemove }: ListItemProps) {
    const [open, setOpen] = useState(false)

    const edit = useCallback(
        (field: keyof Item, value: string) => {
            onEdit({
                ...item,
                [field]: value,
            })
        },
        [item],
    )

    return (
        <li>
            <input
                type='text'
                value={item.name}
                onInput={bindValue(bind('name', edit))}
                readOnly={readonly}
            />
            {!readonly && <button onClick={bind(item.id, onRemove)}>x</button>}
            {open ? (
                <button onClick={bind(false, setOpen)}>-</button>
            ) : (
                <button onClick={bind(true, setOpen)}>+</button>
            )}
            {open && (
                <div>
                    <label>
                        URL:{' '}
                        <input
                            type='text'
                            value={item.url}
                            onInput={bindValue(bind('url', edit))}
                            readOnly={readonly}
                        />
                    </label>
                    <label>
                        Description:{' '}
                        <input
                            type='text'
                            value={item.description}
                            onInput={bindValue(bind('description', edit))}
                            readOnly={readonly}
                        />
                    </label>
                </div>
            )}
        </li>
    )
}
