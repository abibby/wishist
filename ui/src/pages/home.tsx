import { Fragment, h } from 'preact'
import { Link } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import { Friend, friend } from '../api'
import { useUser } from '../auth'
import { Default } from '../layouts/default'
import classNames from 'classnames'
import { ButtonList } from '../components/button-list'
import styles from './home.module.css'

h

export function Home() {
    const [friends, setFriends] = useState<Friend[]>()
    const user = useUser()

    useEffect(() => {
        if (user !== null) {
            friend.list().then(f => setFriends(f))
        }
    }, [user])

    if (user === null) {
        return (
            <Fragment>
                <h1>Wishist</h1>
                <p>Log in to view friends</p>
            </Fragment>
        )
    }

    return (
        <Fragment>
            <h1>Wishist</h1>
            <Link
                class={classNames('button', styles.myList, styles.btn)}
                href={`/list/${user?.username}`}
            >
                My List
            </Link>
            <h2>Friends</h2>
            <ButtonList>
                {friends?.map(f => (
                    <Link
                        key={f.friend_id}
                        class={classNames('button', styles.btn)}
                        href={`/list/${f.friend_username}`}
                    >
                        {f.friend_name}
                    </Link>
                ))}
            </ButtonList>
        </Fragment>
    )
}
