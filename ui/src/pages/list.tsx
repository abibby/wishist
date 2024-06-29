import { Fragment, h } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { User, friend, item, user, userItem } from '../api'
import { useUser } from '../auth'
import { ItemList } from '../components/item-list'
import { useOpenModal } from '../components/modal'
import { ErrorFetchError } from './error-fetch-error'
import { useRoute } from 'preact-iso'

h

export function List() {
    const { params } = useRoute()
    const { username } = params
    const myUser = useUser()
    const myList = myUser?.username === username
    const [listUser, setListUser] = useState<User>()
    const [friends] = friend.useList()
    const isFriend = useMemo(() => {
        if (myUser === null) {
            return false
        }
        return friends?.find(f => f.friend_username === username) !== undefined
    }, [friends, myUser, username])
    const openModal = useOpenModal()

    useEffect(() => {
        user.get(username).then(u => setListUser(u))
    }, [username])

    const addFriend = useCallback(() => {
        if (myUser !== null) {
            friend.create({ friend_username: username })
        } else {
            openModal('/login?message=You must log in to add a friend')
        }
    }, [myUser, username, openModal])

    const removeFriend = useCallback(() => {
        friend.delete({ friend_username: username })
    }, [username])

    const [items, err] = item.useList({ user: username })
    const [userItems] = userItem.useList({ user: username })
    if (err) {
        return <ErrorFetchError err={err} />
    }

    return (
        <Fragment>
            <h1>
                {myList
                    ? 'My Wishlist'
                    : `${listUser?.name ?? username}'s Wishlist`}
            </h1>
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
            <ItemList items={items} userItems={userItems} readonly={!myList} />
        </Fragment>
    )
}
