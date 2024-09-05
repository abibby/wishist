import { Fragment, h } from 'preact'
import { useCallback, useMemo } from 'preact/hooks'
import { User, friendAPI, itemAPI, userAPI, userItemAPI } from '../api'
import { useUser } from '../auth'
import { ItemListEdit } from '../components/item-list-edit'
import { useOpenModal } from '../components/modal'
import { ErrorFetchError } from './error-fetch-error'
import { useRoute } from 'preact-iso'
import { ItemListReadonly } from '../components/item-list-readonly'
import { Conditions } from '../components/conditions'

export function List() {
    const { params } = useRoute()
    const { username } = params
    const [activeUser] = useUser()

    const [listUser, fetchError] = userAPI.useListFirst({ username: username })

    if (fetchError !== undefined) {
        return <ErrorFetchError err={fetchError} />
    }
    if (listUser === undefined) {
        return <div>loading...</div>
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
    if (err) {
        return <ErrorFetchError err={err} />
    }

    return (
        <Fragment>
            <h1>My Wishlist</h1>
            <ItemListEdit items={items} />
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

    const addFriend = useCallback(async () => {
        if (loggedIn) {
            await friendAPI.create({ friend_id: listUser.id })
        } else {
            await openModal('/login?message=You must log in to add a friend')
        }
    }, [listUser.id, loggedIn, openModal])

    const removeFriend = useCallback(async () => {
        await friendAPI.delete({ friend_id: listUser.id })
    }, [listUser.id])

    const [items, err] = itemAPI.useList({ user_id: listUser.id })
    const [userItems] = userItemAPI.useList({ item_user_id: listUser.id })
    if (err) {
        return <ErrorFetchError err={err} />
    }

    return (
        <Conditions>
            <h1>{listUser.name}&apos;s Wishlist</h1>
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
