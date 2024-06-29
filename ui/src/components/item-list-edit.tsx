import { bind, bindValue } from '@zwzn/spicy'
import classNames from 'classnames'
import debounce from 'lodash.debounce'
import { h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { item, Item } from '../api'
import styles from './item-list.module.css'
import { useFlash } from '../hooks/use-flash'
import { useOpenModal } from './modal'
import { Form } from './form/form'

h

const debouncedItemUpdate: typeof item.update = debounce(
    item.update,
    500,
) as typeof item.update

export interface ItemListEditProps {
    items: Item[] | undefined
}
export function ItemListEdit({ items }: ItemListEditProps) {
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
                    <button class='light'>Add</button>
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
    // const remove = useCallback(async () => {
    //     await item.delete({ id: item2.id })
    // }, [item2.id])

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
                    {/* <button onClick={remove}>x</button> */}
                </div>
            </label>
        </li>
    )
}