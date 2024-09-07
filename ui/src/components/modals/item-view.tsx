import { Fragment, h } from 'preact'
import { Modal, ModalActions } from '../modal'
import { useRoute } from 'preact-iso'
import { UserItem, itemAPI, userItemAPI } from '../../api'
import classNames from 'classnames'
import styles from './item-view.module.css'
import { ErrorFetchError } from '../../pages/error-fetch-error'
import { useCallback } from 'preact/hooks'
import { bind } from '@zwzn/spicy'

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

    const [items, err] = itemAPI.useList({ id: Number(id) })
    const [userItems] = userItemAPI.useList({ item_id: Number(id) })
    const item = items?.[0] ?? emptyItem
    const ui = userItems?.[0]
    const isThinking = ui?.type === 'thinking'
    const isPurchased = ui?.type === 'purchased'

    const setType = useCallback(
        async (type: UserItem['type']) => {
            if (ui?.type === type) {
                await userItemAPI.delete({ item_id: Number(id) })
                return
            }

            const newUserItem = {
                item_id: Number(id),
                type: type,
            }
            if (ui?.type !== undefined) {
                await userItemAPI.update(newUserItem)
            } else {
                await userItemAPI.create(newUserItem)
            }
        },
        [id, ui?.type],
    )
    if (err) {
        return (
            <Modal title={err.message}>
                <ErrorFetchError err={err} />
            </Modal>
        )
    }

    return (
        <Modal title={item.name} class={styles.readonly}>
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

            <ModalActions>
                <button
                    class={classNames({ primary: isThinking })}
                    onClick={bind('thinking', setType)}
                >
                    Thinking of Buying
                </button>
                <button
                    class={classNames({ primary: isPurchased })}
                    onClick={bind('purchased', setType)}
                >
                    Bought It
                </button>
            </ModalActions>
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
    if (you) {
        if (count === 0) {
            return 'Only you'
        }
        return 'You + ' + count
    }

    if (count === 0) {
        return 'No one'
    }
    return String(count)
}
