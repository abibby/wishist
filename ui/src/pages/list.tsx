import { Fragment, h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { friend } from '../api'
import { useUser } from '../auth'
import { ItemList } from '../components/item-list'
import { openModal } from '../components/modal'
import { LoginModal } from '../components/modals/login'
import { FetchError } from '../api/internal'
import { Error404 } from './error-404'
import { ErrorFetchError } from './error-fetch-error'

h

interface ListProps {
    matches: {
        username: string
    }
}

export function List({ matches }: Readonly<ListProps>) {
    const { username } = matches
    const myUser = useUser()
    const [fetchError, setFetchError] = useState<FetchError<unknown>>()
    const myList = myUser?.username === username

    const [isFriend, setIsFriend] = useState(false)
    useEffect(() => {
        if (myUser === null) {
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
    }, [username, myUser])

    const addFriend = useCallback(() => {
        if (myUser !== null) {
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
    }, [username, myUser, setIsFriend])

    const removeFriend = useCallback(() => {
        friend.delete({ username: username })
        setIsFriend(false)
    }, [username, setIsFriend])

    if (fetchError !== undefined) {
        return <ErrorFetchError err={fetchError} />
    }

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
                    {myUser !== null && (
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
            <ItemList
                username={username}
                readonly={!myList}
                onFetchError={setFetchError}
            />
        </Fragment>
    )
}
