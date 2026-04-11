import { bind } from '@zwzn/spicy'
import classNames from 'classnames'
import { h } from 'preact'
import { Item, UserItem } from '../api'
import styles from './item-list.module.css'
import { useOpenModal } from './modal'
import { Conditions } from './conditions'
import { Eye, ShoppingBag } from 'preact-feather'
import { PageSpinner } from './spinner'

interface ItemListReadonlyProps {
    items: Item[] | undefined
    userItems: UserItem[] | undefined
}
export function ItemListReadonly({ items, userItems }: ItemListReadonlyProps) {
    if (items === undefined) {
        return <PageSpinner />
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

    const isThinking = ui?.type === 'thinking'
    const isPurchased = ui?.type === 'purchased'

    const hasExtraInfo = item.url !== '' || item.description !== ''
    return (
        <Conditions>
            <li
                class={classNames(styles.item, styles.readonly, {
                    [styles.thinking]:
                        (item.thinking_count ?? 0) > 0 || isThinking,
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
                <div class={styles.icon}>
                    {!!item.price && (
                        <span>{priceEstimate(item.price / 100)}</span>
                    )}
                    <Eye v-if={isThinking} />
                    <ShoppingBag v-else-if={isPurchased} />
                </div>
            </li>
        </Conditions>
    )
}

function priceEstimate(i: number): string {
    if (i < 50) {
        return '$'
    }
    if (i < 100) {
        return '$$'
    }
    if (i < 250) {
        return '$$$'
    }
    return '$$$$'
}
