import { h } from 'preact'
import { Link } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import { Friend, friend } from '../api'
import { username } from '../auth'
import { Default } from '../layouts/default'

h

export function Home() {
    const [user, setUser] = useState<string>()
    const [friends, setFriends] = useState<Friend[]>()
    useEffect(() => {
        username().then(u => setUser(u))
    }, [setUser])
    useEffect(() => {
        friend.list().then(f => setFriends(f))
    }, [setFriends])
    return (
        <Default>
            <h1>Wishist</h1>
            <Link href={`/list/${user}`}>My List</Link>
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
        </Default>
    )
}
