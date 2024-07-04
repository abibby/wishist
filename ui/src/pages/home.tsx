import { Fragment, h } from 'preact'
import { friendAPI } from '../api'
import { useUser } from '../auth'
import classNames from 'classnames'
import { ButtonList } from '../components/button-list'
import styles from './home.module.css'
import { ErrorFetchError } from './error-fetch-error'

h

export function Home() {
    const [user] = useUser()
    const [friends, err] = friendAPI.useList()

    if (user === null) {
        return (
            <Fragment>
                <h1>Wishist</h1>
                <p>Log in to view friends</p>
            </Fragment>
        )
    }

    if (err !== undefined) {
        return <ErrorFetchError err={err} />
    }

    return (
        <Fragment>
            <h1>Wishist</h1>
            <a
                class={classNames('button', 'light', styles.myList, styles.btn)}
                href={`/list/${user?.username}`}
            >
                My List
            </a>
            <h2>Friends</h2>
            <ButtonList>
                {friends?.map(f => (
                    <a
                        key={f.friend_id}
                        class={classNames('button', 'light', styles.btn)}
                        href={`/list/${f.friend_username}`}
                    >
                        {f.friend_name}
                    </a>
                ))}
            </ButtonList>
        </Fragment>
    )
}
