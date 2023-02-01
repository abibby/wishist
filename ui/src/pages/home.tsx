import { Fragment, h } from 'preact'
import { Link } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import { Friend, friend } from '../api'
import { useUser } from '../auth'
import { Default } from '../layouts/default'

h

export function Home() {
    const [friends, setFriends] = useState<Friend[]>()
    const user = useUser()

    useEffect(() => {
        friend.list().then(f => setFriends(f))
    }, [setFriends])

    if (user === null) {
        return (
            <Default>
                <h1>Wishist</h1>
            </Default>
        )
    }

    return (
        <Fragment>
            <h1>Wishist</h1>
            <Link href={`/list/${user?.username}`}>My List</Link>
            <h2>Friends</h2>
            <ul>
                {friends?.map(f => (
                    <li key={f.friend_id}>
                        <Link href={`/list/${f.friend_name}`}>
                            {f.friend_username}
                        </Link>
                    </li>
                ))}
            </ul>
        </Fragment>
    )
}
