import { Fragment, h } from 'preact'
import { Modal } from '../modal'
import { useRoute } from 'preact-iso'
import { item as itemAPI, userItem } from '../../api'
import classNames from 'classnames'
import styles from './item-view.module.css'
import { ErrorFetchError } from '../../pages/error-fetch-error'

h

const emptyItem = {
    name: '',
    url: '',
    description: '',
    thinking_count: undefined,
    purchased_count: undefined,
}

export function ItemViewModal() {
    const { params } = useRoute()
    const { id } = params

    const [items, err] = itemAPI.useList({ id: id })
    const [userItems] = userItem.useList({ item_id: id })
    const item = items?.[0] ?? emptyItem
    const ui = userItems?.[0]
    const isThinking = ui?.type === 'thinking'
    const isPurchased = ui?.type === 'purchased'

    if (err) {
        return (
            <Modal title={err.message}>
                <ErrorFetchError err={err} />
            </Modal>
        )
    }

    return (
        <Modal title={item.name}>
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
        </Modal>
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
