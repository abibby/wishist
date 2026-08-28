import { Fragment, h } from 'preact'
import { friendAPI } from '../api'
import { useUser } from '../auth'
import styles from './friends.module.css'
import { ErrorFetchError } from './error-fetch-error'
import { ChevronRight } from 'preact-feather'
import { useMemo } from 'preact/hooks'
import { day, hour, minute } from '../time'

export function Friends() {
    const [user, userLoading] = useUser()
    const [friends, err] = friendAPI.useList()

    const friendsSorted = useMemo(() => {
        if (!friends) {
            return friends
        }
        return Array.from(friends).sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
    }, [friends])

    if (userLoading) {
        return <Fragment />
    }
    if (user === null) {
        return (
            <Fragment>
                <h1>Friends</h1>
                <p>Log in to view friends</p>
            </Fragment>
        )
    }

    if (err !== undefined) {
        return <ErrorFetchError err={err} />
    }

    return (
        <Fragment>
            <h1>Friends</h1>
            <ul class={styles.friends}>
                {friendsSorted?.map(f => (
                    <li key={f.friend_id}>
                        <a class={styles.friend} href={`/list/${f.username}`}>
                            <img
                                class={styles.avatar}
                                src={f.avatar_url}
                                alt=''
                            />
                            <div class={styles.name}>{f.name}</div>
                            <div class={styles.date}>
                                Last updated {formatDate(f.last_updated)}
                            </div>
                            <ChevronRight class={styles.chevron} />
                        </a>
                    </li>
                ))}
            </ul>
        </Fragment>
    )
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en-CA', {
    style: 'long',
})
const dateFormatter = new Intl.DateTimeFormat('en-CA', {})

function formatDate(date: string): string {
    const d = new Date(date).getTime()
    const now = Date.now()
    const diff = now - d

    if (diff < minute) {
        return 'Just now'
    }
    if (diff < hour) {
        return relativeTimeFormatter.format(
            -Math.floor(diff / minute),
            'minutes',
        )
    }
    if (diff < day) {
        return relativeTimeFormatter.format(-Math.floor(diff / hour), 'hours')
    }
    if (diff < day * 7) {
        return relativeTimeFormatter.format(-Math.floor(diff / day), 'days')
    }
    return dateFormatter.format(d)
}
