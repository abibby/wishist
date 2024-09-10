import { bind, bindValue } from '@zwzn/spicy'
import classNames from 'classnames'
import debounce from 'lodash.debounce'
import { h } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { itemAPI, Item } from '../api'
import styles from './item-list.module.css'
import { useFlash } from '../hooks/use-flash'
import { useOpenModal } from './modal'
import { Form } from './form/form'
import { PageSpinner, Spinner } from './spinner'
import { openToast } from './toast'
import { sleep } from '../utils'

export interface ItemListEditProps {
    items: Item[] | undefined
}
export function ItemListEdit({ items }: ItemListEditProps) {
    const [newItem, setNewItem] = useState('')
    const [saving, setSaving] = useState(false)

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
}

function Row({ item }: RowProps) {
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
    return (
        <li>
            <label class={styles.item}>
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
