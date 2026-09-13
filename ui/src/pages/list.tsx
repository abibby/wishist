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
import { UserMinus, UserPlus } from 'preact-feather'

export function List() {
    const { params } = useRoute()
    const { username } = params
    const [activeUser] = useUser()

    const [listUser, userFetchError] = userAPI.useFirst({ username: username })
    const [items, itemFetchError, itemsLoading] = itemAPI.useList({
        username: username,
    })

    if (userFetchError) {
        return <ErrorFetchError err={userFetchError} />
    }
    if (itemFetchError) {
        return <ErrorFetchError err={itemFetchError} />
    }

    // if (listUser === undefined || userLoading) {
    //     return <Fragment />
    // }

    if (activeUser?.username === username) {
        console.log(itemsLoading)

        return (
            <ActiveUserList
                items={items ?? []}
                loading={itemsLoading === 'loading'}
            />
        )
    }
    return (
        <OtherUserList
            items={items ?? []}
            username={username}
            listUser={listUser ?? null}
            activeUser={activeUser}
        />
    )
}

interface MyListProps {
    items: Item[]
    loading: boolean
}

function ActiveUserList({ items, loading }: MyListProps) {
    const [sortedItems, setSortedItems] = useState<Item[]>()

    useEffect(
        () =>
            setSortedItems(Array.from(items).sort((a, b) => a.order - b.order)),
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

    return (
        <Fragment>
            <h1>My Wishlist</h1>
            <ItemListEdit
                items={sortedItems}
                onMoveItem={moveItem}
                loading={loading}
            />
        </Fragment>
    )
}

interface OtherListProps {
    items: Item[]
    username: string
    listUser: User | null
    activeUser: User | null
}

function OtherUserList({
    items,
    username,
    listUser,
    activeUser,
}: OtherListProps) {
    const openModal = useOpenModal()
    const loggedIn = activeUser !== null

    const [friends] = friendAPI.useList()
    const isFriend = useMemo(() => {
        if (!loggedIn) {
            return false
        }
        return !!friends?.find(f => f.friend_id === listUser?.id)
    }, [friends, listUser?.id, loggedIn])

    const addFriend = useCallback(() => {
        if (loggedIn && listUser?.id) {
            friendAPI.create({ friend_id: listUser.id })
        } else {
            openModal('/login?message=You must log in to add a friend')
        }
    }, [listUser?.id, loggedIn, openModal])

    const removeFriend = useCallback(() => {
        if (listUser?.id) {
            friendAPI.delete({ friend_id: listUser?.id })
        }
    }, [listUser?.id])

    const [userItems] = userItemAPI.useList({
        item_username: username,
    })

    return (
        <Conditions>
            <h1>{listUser?.name ?? username}'s Wishlist</h1>
            <button v-if={isFriend} onClick={removeFriend}>
                <UserMinus />
            </button>
            <Fragment v-else>
                <p>
                    Adding a friend will let you keep track of who else is
                    thinking about getting items.
                </p>
                <button class='primary' onClick={addFriend}>
                    <UserPlus />
                </button>
            </Fragment>
            <ItemListReadonly items={items} userItems={userItems} />
        </Conditions>
    )
}
