import { h } from 'preact'
import { Link } from 'preact-router'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { Friend, friend } from '../api'
import { invite } from '../api/auth'
import { username } from '../auth'
import { Default } from '../layouts/default'

h

export function Home() {
    const [user, setUser] = useState<string>()
    const [friends, setFriends] = useState<Friend[]>()
    const [inviteToken, setInviteToken] = useState<string>()

    useEffect(() => {
        username().then(u => setUser(u))
    }, [setUser])
    useEffect(() => {
        friend.list().then(f => setFriends(f))
    }, [setFriends])

    const inviteFriend = useCallback(async () => {
        const response = await invite()
        setInviteToken(response.invite_token)
    }, [setInviteToken])

    const inviteLink =
        location.origin + '/create-user/passwordless#' + inviteToken

    const copyInviteLink = useCallback(async () => {
        await navigator.clipboard.writeText(inviteLink)
        console.log('test')
    }, [inviteLink])

    return (
        <Default>
            <h1>Wishist</h1>
            <Link href={`/list/${user}`}>My List</Link>
            <h2>Friends</h2>
            <button onClick={inviteFriend}>Invite Friend</button>
            {inviteToken && (
                <div>
                    <textarea readOnly>{inviteLink}</textarea>{' '}
                    <button onClick={copyInviteLink}>Copy</button>
                </div>
            )}
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
