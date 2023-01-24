import { buildRestModel } from './rest'

export interface Item {
    id: number
    user_id: number
    name: string
    description: string
    url: string
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

export const friends = buildRestModel<
    Friend,
    never,
    Omit<Friend, 'user_id'>,
    never,
    Omit<Friend, 'user_id'>
>('/friend')
