import debounce from 'lodash.debounce'
import { Fragment, h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { friend, item } from '../api'
import { useUser } from '../auth'
import { ItemList } from '../components/item-list'
import { openModal } from '../components/modal'
import { CreatePasswordlessUser } from '../components/modals/create-passwordless-user'

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
    const myID = user?.id
    const myList = user?.username === name

    const [isFriend, setIsFriend] = useState(false)
    useEffect(() => {
        if (myID === undefined) {
            setIsFriend(false)
        } else {
            friend
                .list()
                .then(friends =>
                    setIsFriend(
                        friends.find(f => f.friend_username === name) !==
                            undefined,
                    ),
                )
        }
    }, [setIsFriend, myID])

    const addFriend = useCallback(() => {
        if (myID !== undefined) {
            friend.create({ username: name })
            setIsFriend(true)
        } else {
            openModal(CreatePasswordlessUser, {
                message:
                    'You can create an instant user to add friends and see what other people have purchased',
            }).then(userCreated => {
                if (userCreated) {
                    friend.create({ username: name })
                    setIsFriend(true)
                }
            })
        }
    }, [name, myID, setIsFriend])

    const removeFriend = useCallback(() => {
        friend.delete({ username: name })
        setIsFriend(false)
    }, [name, setIsFriend])

    return (
        <Fragment>
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
        </Fragment>
    )
}
