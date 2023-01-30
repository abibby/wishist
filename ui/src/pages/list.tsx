import debounce from 'lodash.debounce'
import { h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { friend, Friend, item } from '../api'
import { useUser } from '../auth'
import { ItemList } from '../components/item-list'
import { Default } from '../layouts/default'

h

const debouncedItemUpdate: typeof item.update = debounce(
    item.update,
    500,
) as any

interface ListProps {
    matches: {
        name: string
    }
}

export function List({ matches }: ListProps) {
    const { name } = matches
    const user = useUser()
    const myList = user?.username === name

    const [friendsList, setFriendsList] = useState<Friend[]>()
    useEffect(() => {
        friend.list().then(f => setFriendsList(f))
    }, [setFriendsList])
    const addFriend = useCallback(() => {
        friend.create({ username: name })
        setFriendsList(f =>
            f?.concat([
                {
                    user_id: 0,
                    friend_id: 0,
                    friend_name: name,
                    friend_username: name,
                },
            ]),
        )
    }, [name, setFriendsList])
    const removeFriend = useCallback(() => {
        friend.delete({ username: name })
        setFriendsList(f => f?.filter(f => f.friend_username !== name))
    }, [name, setFriendsList])

    const isFriend =
        friendsList?.find(f => f.friend_username === name) !== undefined

    return (
        <Default>
            <h1>{myList ? 'My Wishlist' : `${name}'s Wishlist`}</h1>
            {!myList &&
                (isFriend ? (
                    <button onClick={removeFriend}>Remove Friend</button>
                ) : (
                    <button class='primary' onClick={addFriend}>
                        Add Friend
                    </button>
                ))}
            <ItemList username={name} readonly={!myList} />
        </Default>
    )
}
