import { bind, bindValue } from '@zwzn/spicy'
import debounce from 'lodash.debounce'
import { Fragment, h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { item, Item } from '../api'
import { username } from '../auth'
import { Default } from '../layouts/default'

h

const debouncedItemUpdate: typeof item.update = debounce(
    item.update,
    500,
) as any

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
        item.list({ user: name })
            .then(setItems)
            .catch(() => setItems(undefined))
    }, [name])
    useEffect(() => {
        username().then(user => {
            setReadonly(user !== name)
        })
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

    if (items === undefined) {
        return <div>loading...</div>
    }

    return (
        <Default>
            <ul>
                {items.map(i => (
                    <ListItem
                        key={i.id}
                        item={i}
                        readonly={readonly}
                        onChange={listChange}
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
        </Default>
    )
}

interface ListItemProps {
    item: Item
    readonly: boolean
    onChange: (item: Item) => void
    onRemove: (id: number) => void
}

function ListItem({ item, readonly, onChange, onRemove }: ListItemProps) {
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
            <input
                type='text'
                value={item.name}
                onInput={bindValue(bind('name', edit))}
                readOnly={readonly}
            />
            {!readonly && <button onClick={bind(item.id, onRemove)}>x</button>}
            {(!readonly || item.url !== '' || item.description !== '') && (
                <Fragment>
                    <button onClick={bind(!open, setOpen)}>
                        {open ? '-' : '+'}
                    </button>
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
                                    onInput={bindValue(
                                        bind('description', edit),
                                    )}
                                    readOnly={readonly}
                                />
                            </label>
                        </div>
                    )}
                </Fragment>
            )}
        </li>
    )
}
