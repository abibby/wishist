import { Fragment, h } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { Item, User, friendAPI, itemAPI, userAPI, userItemAPI } from '../api'
import { useUser } from '../auth'
import { ItemListEdit } from '../components/item-list-edit'
import { useOpenModal } from '../components/modal'
import { ErrorFetchError } from './error-fetch-error'
import { useRoute } from 'preact-iso'
import { ItemListReadonly } from '../components/item-list-readonly'
import { Conditions } from '../components/conditions'
import { PageSpinner } from '../components/spinner'

export function List() {
    const { params } = useRoute()
    const { username } = params
    const [activeUser, userLoading] = useUser()

    const [listUser, fetchError] = userAPI.useFirst({ username: username })

    if (fetchError !== undefined) {
        return <ErrorFetchError err={fetchError} />
    }
    if (listUser === undefined || userLoading) {
        return <PageSpinner />
    }

    if (activeUser?.id === listUser.id) {
        return <ActiveUserList listUser={listUser} />
    }
    return <OtherUserList listUser={listUser} activeUser={activeUser} />
}

interface MyListProps {
    listUser: User
}

function ActiveUserList({ listUser }: MyListProps) {
    const [items, err] = itemAPI.useList({ user_id: listUser.id })
    const [sortedItems, setSortedItems] = useState<Item[]>()

    useEffect(
        () =>
            setSortedItems(
                Array.from(items ?? []).sort((a, b) => a.order - b.order),
            ),
        [items],
    )

    const moveItem = useCallback(async (item: Item, newOrder: number) => {
        const oldOrder = item.order
        setSortedItems(prevItems => {
            return prevItems?.map(it => {
                if (it.id === item.id) {
                    return itemAPI.softUpdate({ ...it, order: newOrder })
                }

                if (oldOrder > newOrder) {
                    if (it.order >= newOrder && it.order < oldOrder) {
                        return itemAPI.softUpdate({
                            ...it,
                            order: it.order + 1,
                        })
                    }
                } else if (oldOrder < newOrder) {
                    if (it.order > oldOrder && it.order <= newOrder) {
                        return itemAPI.softUpdate({
                            ...it,
                            order: it.order - 1,
                        })
                    }
                }

                return it
            })
        })
        await itemAPI.update({
            ...item,
            order: newOrder,
        })
    }, [])

    if (err) {
        return <ErrorFetchError err={err} />
    }

    return (
        <Fragment>
            <h1>My Wishlist</h1>
            <ItemListEdit items={sortedItems} onMoveItem={moveItem} />
        </Fragment>
    )
}

interface OtherListProps {
    listUser: User
    activeUser: User | null
}

function OtherUserList({ listUser, activeUser }: OtherListProps) {
    const openModal = useOpenModal()
    const loggedIn = activeUser !== null

    const [friends] = friendAPI.useList()
    const isFriend = useMemo(() => {
        if (!loggedIn) {
            return false
        }
        return !!friends?.find(f => f.friend_id === listUser.id)
    }, [friends, listUser.id, loggedIn])

    const addFriend = useCallback(() => {
        if (loggedIn) {
            friendAPI.create({ friend_id: listUser.id })
        } else {
            openModal('/login?message=You must log in to add a friend')
        }
    }, [listUser.id, loggedIn, openModal])

    const removeFriend = useCallback(() => {
        friendAPI.delete({ friend_id: listUser.id })
    }, [listUser.id])

    const [items, err] = itemAPI.useList({ user_id: listUser.id })
    const [userItems] = userItemAPI.useList({ item_user_id: listUser.id })
    if (err) {
        return <ErrorFetchError err={err} />
    }

    return (
        <Conditions>
            <h1>{listUser.name}'s Wishlist</h1>
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
            <ItemListReadonly items={items} userItems={userItems} />
        </Conditions>
    )
}
