import { get, set } from 'idb-keyval'
import { db } from './database'
import { claimsSignal } from './auth'
import { itemAPI } from './api'

claimsSignal.subscribe(async claims => {
    if (!claims) {
        return
    }
    if ((await get('restore-compete')) === true) {
        return
    }

    const userID = Number(claims.sub)

    const clientItems = await db.items.where('user_id').equals(userID).toArray()
    const serverItems = await itemAPI.list({ user_id: userID })

    const maxClientID = Math.max(...clientItems.map(item => item.id))
    const maxServerID = Math.max(...serverItems.map(item => item.id))

    if (maxClientID <= maxServerID) {
        return
    }

    for (const clientItem of clientItems) {
        const serverItem = serverItems.find(i => i.id === clientItem.id)

        if (!serverItem) {
            await itemAPI.create(clientItem)
        } else {
            await itemAPI.update(clientItem)
        }
    }
    await set('restore-compete', true)
})
