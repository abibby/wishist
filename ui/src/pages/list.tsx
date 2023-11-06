import debounce from 'lodash.debounce'
import { Fragment, h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { friend, item } from '../api'
import { useUser } from '../auth'
import { ItemList } from '../components/item-list'
import { openModal } from '../components/modal'
import { LoginModal } from '../components/modals/login'

h

interface ListProps {
    matches: {
        username: string
    }
}

export function List({ matches }: ListProps) {
    const { username } = matches
    const myUser = useUser()
    const myList = myUser?.username === username
    const loggedIn = myUser?.id !== undefined

    const [isFriend, setIsFriend] = useState(false)
    useEffect(() => {
        if (loggedIn) {
            setIsFriend(false)
        } else {
            friend
                .list()
                .then(friends =>
                    setIsFriend(
                        friends.find(f => f.friend_username === username) !==
                            undefined,
                    ),
                )
        }
    }, [setIsFriend, loggedIn])

    const addFriend = useCallback(() => {
        if (loggedIn) {
            friend.create({ username: username })
            setIsFriend(true)
        } else {
            openModal(LoginModal, {
                message: 'You must log in to add a friend.',
            }).then(userCreated => {
                if (userCreated) {
                    friend.create({ username: username })
                    setIsFriend(true)
                }
            })
        }
    }, [username, loggedIn, setIsFriend])

    const removeFriend = useCallback(() => {
        friend.delete({ username: username })
        setIsFriend(false)
    }, [username, setIsFriend])

    return (
        <Fragment>
            <h1>{myList ? 'My Wishlist' : `${username}'s Wishlist`}</h1>
            {!myList && (
                <Fragment>
                    {isFriend ? (
                        <button onClick={removeFriend}>Remove Friend</button>
                    ) : (
                        <Fragment>
                            <p>
                                Adding a friend will let you keep track of who
                                else is thinking about getting items.
                            </p>
                            <button class='primary' onClick={addFriend}>
                                Add Friend
                            </button>
                        </Fragment>
                    )}
                    {loggedIn && (
                        <Fragment>
                            <p>
                                Click the 👁️ if you are thinking of buying the
                                item and the 🛍️ if you have already purchased
                                it.
                            </p>
                            <p>
                                Clicking on the item will show more how many
                                people are thinking of buying the item as well
                                as any related links or descriptions.
                            </p>
                        </Fragment>
                    )}
                </Fragment>
            )}
            <ItemList username={username} readonly={!myList} />
        </Fragment>
    )
}
