import { bind, bindValue } from '@zwzn/spicy'
import { h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { Item, useList } from '../hooks/use-list'

h

export function List() {
    const items = useList(1)
    const [newItem, setNewItem] = useState('')
    const [newItems, setNewItems] = useState<Item[]>([])
    const [removedItemIDs, setRemovedItemIDs] = useState<number[]>([])
    const addItem = useCallback(async () => {
        const item = await fetch('/list/add', {
            method: 'POST',
            body: JSON.stringify({
                user_id: 1,
                name: newItem,
                description: '',
                url: '',
            }),
        })

        const createdItem = await item.json()
        setNewItems(i => [...i, createdItem])
        setNewItem('')
    }, [newItem, setNewItem])

    const removeItem = useCallback(
        async (id: number) => {
            await fetch('/list/remove', {
                method: 'POST',
                body: JSON.stringify({
                    item_id: id,
                }),
            })
            setRemovedItemIDs(ids => [...ids, id])
        },
        [setRemovedItemIDs],
    )
    const editItem = useCallback(
        async (id: number, name: string) => {
            await fetch('/list/edit', {
                method: 'POST',
                body: JSON.stringify({
                    id: id,
                    name: name,
                    description: '',
                    url: '',
                }),
            })
        },
        [newItem, setNewItem],
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
                {[...items, ...newItems]
                    .filter(i => !removedItemIDs.includes(i.id))
                    .map(i => (
                        <li>
                            <input
                                type='text'
                                value={i.name}
                                onChange={bindValue(bind(i.id, editItem))}
                            />
                            <button onClick={bind(i.id, removeItem)}>x</button>
                        </li>
                    ))}
                <li>
                    <input
                        type='text'
                        value={newItem}
                        onInput={bindValue(setNewItem)}
                        onKeyDown={newItemKeyDown}
                    />
                    <button onClick={addItem}>Add</button>
                </li>
            </ul>
        </div>
    )
}
