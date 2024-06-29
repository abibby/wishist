import { Fragment, h } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { Item, User, UserItem, friend, item, user, userItem } from '../api'
import { useUser } from '../auth'
import { ItemListEdit } from '../components/item-list-edit'
import { useOpenModal } from '../components/modal'
import { ErrorFetchError } from './error-fetch-error'
import { useRoute } from 'preact-iso'
import { ItemListReadonly } from '../components/item-list-readonly'
import { Conditions } from '../components/conditions'

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
        <Conditions>
            <h1 v-if={myList}>My Wishlist</h1>
            <Fragment v-else>
                <h1>{listUser?.name ?? username}'s Wishlist</h1>
                <button v-if={isFriend} onClick={removeFriend}>
                    Remove Friend
                </button>
                <Fragment v-else>
                    <p>
                        Adding a friend will let you keep track of who else is
                        thinking about getting items.
                    </p>
                    <button class='primary' onClick={addFriend}>
                        Add Friend
                    </button>
                </Fragment>
            </Fragment>
            <ItemList items={items} userItems={userItems} readonly={!myList} />
        </Conditions>
    )
}

interface ItemListProps {
    items: Item[] | undefined
    userItems: UserItem[] | undefined
    readonly: boolean
}
function ItemList({ items, userItems, readonly }: ItemListProps) {
    if (readonly) {
        return <ItemListReadonly items={items} userItems={userItems} />
    }
    return <ItemListEdit items={items} />
}
