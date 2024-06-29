import { NoArgs, buildRestModel } from './rest'
import { User as _User } from './user'

export type User = _User

export interface Item {
    id: number
    user_id: number
    name: string
    description: string
    url: string
    thinking_count?: number
    purchased_count?: number
}

export const item = buildRestModel<
    Item,
    { user: string } | { id: string | number },
    Omit<Item, 'id' | 'user_id'>,
    Omit<Item, 'user_id'>
>('/item', ['id'], (m, params) => {
    if ('user' in params) {
        // return params.user === m.user_id
        return true
    }
    if ('id' in params) {
        return params.id === m.id
    }
    return false
})

export interface Friend {
    user_id: number
    friend_id: number
    friend_name: string
    friend_username: string
}

export interface FriendCreateRequest {
    friend_username: string
}
export interface FriendDeleteRequest {
    friend_username: string
}

export const friend = buildRestModel<
    Friend,
    NoArgs,
    FriendCreateRequest,
    never,
    FriendDeleteRequest
>('/friend', ['friend_username'], () => true)

export interface UserItem {
    user_id: number
    item_id: number
    type: 'thinking' | 'purchased'
}

export const userItem = buildRestModel<
    UserItem,
    { user: string } | { item_id: string | number },
    Omit<UserItem, 'user_id'>,
    Omit<UserItem, 'user_id'>,
    Pick<UserItem, 'item_id'>
>('/user-item', ['user_id', 'item_id'], () => true)

export * as user from './user'
