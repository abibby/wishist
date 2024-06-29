import { bind } from '@zwzn/spicy'
import classNames from 'classnames'
import { h } from 'preact'
import { useCallback } from 'preact/hooks'
import { Item, UserItem, userItem } from '../api'
import { userID, useUser } from '../auth'
import styles from './item-list.module.css'

import { useOpenModal } from './modal'

h

interface ItemListReadonlyProps {
    items: Item[] | undefined
    userItems: UserItem[] | undefined
}
export function ItemListReadonly({ items, userItems }: ItemListReadonlyProps) {
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
