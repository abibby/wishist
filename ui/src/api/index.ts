import { db } from '../database'
import { NoArgs, buildRestModel } from './rest'
import { User } from './user'

export type { User }

export type Item = {
    id: number
    user_id: number
    name: string
    description: string
    url: string
    thinking_count?: number
    purchased_count?: number
}

export const itemAPI = buildRestModel<
    Item,
    'id',
    { user_id: number } | { id: number },
    Omit<Item, 'id' | 'user_id'>,
    Omit<Item, 'user_id'>
>('/item', 'id', db.items)

export type Friend = {
    friend_id: number
    friend_name: string
    friend_username: string
}

export const friendAPI = buildRestModel<
    Friend,
    'friend_id',
    NoArgs,
    Pick<Friend, 'friend_id'>,
    never,
    Pick<Friend, 'friend_id'>
>('/friend', 'friend_id', db.friends)

export type UserItem = {
    item_user_id: number
    item_id: number
    type: 'thinking' | 'purchased'
}

export const userItemAPI = buildRestModel<
    UserItem,
    'item_id',
    { item_user_id: number } | { item_id: number },
    Omit<UserItem, 'item_user_id'>,
    Omit<UserItem, 'item_user_id'>,
    Pick<UserItem, 'item_id'>
>('/user-item', 'item_id', db.userItems)

export interface CreateUserRequest {
    name: string
    email: string
    username: string
    password: string
}

export const userAPI = buildRestModel<
    User,
    'id',
    { username: string },
    CreateUserRequest,
    never,
    never
>('/user', 'id', db.users)

export * as authAPI from './auth'
