import { buildRestModel } from './rest'

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
    { user: string },
    Omit<Item, 'id' | 'user_id'>,
    Omit<Item, 'user_id'>
>('/item')

export interface Friend {
    user_id: number
    friend_id: number
    friend_name: string
    friend_username: string
}

export interface FriendCreateRequest {
    username: string
}
export interface FriendDeleteRequest {
    username: string
}

export const friend = buildRestModel<
    Friend,
    never,
    FriendCreateRequest,
    never,
    FriendDeleteRequest
>('/friend')

export interface UserItem {
    user_id: number
    item_id: number
    type: 'thinking' | 'purchased'
}

export const userItem = buildRestModel<
    UserItem,
    { user: string },
    Omit<UserItem, 'user_id'>,
    Omit<UserItem, 'user_id'>,
    Pick<UserItem, 'item_id'>
>('/user-item')
