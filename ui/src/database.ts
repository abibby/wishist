import Dexie, { type EntityTable } from 'dexie'
import type { Friend, Item, User, UserItem } from './api'

const db = new Dexie('Wishist') as Dexie & {
    items: EntityTable<Item, 'id'>
    userItems: EntityTable<UserItem, 'item_id'>
    friends: EntityTable<Friend, 'friend_id'>
    users: EntityTable<User, 'id'>
}

db.version(1).stores({
    items: 'id,user_id',
    userItems: 'item_id,item_user_id',
    friends: 'friend_id',
    users: 'id,username',
})

export { db }
