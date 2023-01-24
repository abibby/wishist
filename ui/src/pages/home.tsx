import { h } from 'preact'
import { Link } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import { Friend, friends } from '../api'
import { username } from '../auth'
import { Default } from '../layouts/default'

h

export function Home() {
    const [user, setUser] = useState<string>()
    const [friendsList, setFriendsList] = useState<Friend[]>()
    useEffect(() => {
        username().then(u => setUser(u))
    }, [setUser])
    useEffect(() => {
        friends.list().then(f => setFriendsList(f))
    }, [setFriendsList])
    return (
        <Default>
            <h1>Wishlist</h1>
            <Link href={`/list/${user}`}>My List</Link>
            <ul>
                {friendsList?.map(f => (
                    <li key={f.friend_id}>
                        <Link href={`/list/${f.friend_name}`}>
                            {f.friend_username}
                        </Link>
                    </li>
                ))}
            </ul>
        </Default>
    )
}
