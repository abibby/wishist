import { db } from '../database'
import { FetchError } from './fetch-error'
import { NoArgs, buildRestModel } from './rest'
import { User } from './user'

export type { User }
export { FetchError }

export type Item = {
    id: number
    username: string
    name: string
    description: string
    url: string
    price: number | null
    thinking_count?: number
    purchased_count?: number
    order: number
}

export const itemAPI = buildRestModel<
    Item,
    'id',
    { username: string } | { id: number },
    Omit<Item, 'id' | 'username'>,
    Omit<Item, 'username'>
>('/item', 'id', db.items)

export type Friend = {
    friend_id: number
}

export type UserFriend = User &
    Friend & {
        last_updated: string
    }

export const friendAPI = buildRestModel<
    UserFriend,
    'friend_id',
    NoArgs,
    Friend,
    never,
    Friend
>('/friend', 'friend_id', db.friends)

export type UserItem = {
    item_username: string
    item_id: number
    type: 'thinking' | 'purchased'
}

export const userItemAPI = buildRestModel<
    UserItem,
    'item_id',
    { item_username: string } | { item_id: number },
    Omit<UserItem, 'item_username'>,
    Omit<UserItem, 'item_username'>,
    Pick<UserItem, 'item_id'>
>('/user-item', 'item_id', db.userItems)

export interface CreateUserRequest {
    name: string
    email: string
    username: string
    password: string
}

export interface UserUpdateRequest {
    id: number
    name: string
}

export const userAPI = buildRestModel<
    User,
    'id',
    { username: string },
    CreateUserRequest,
    UserUpdateRequest,
    never
>('/user', 'id', db.users)

export * as authAPI from './auth'
export type { LoginRequest, LoginResponse } from './auth'
