import { useEffect, useState } from 'preact/hooks'

export interface Item {
    id: number
    user_id: number
    name: string
    description: string
    url: string
}

export function useList(userID: number): Item[] | undefined {
    const [items, setItems] = useState<Item[] | undefined>(undefined)
    useEffect(() => {
        fetch(`/list?user_id=${userID}`).then(async r => {
            if (!r.ok) {
                setItems(undefined)
                return
            }
            setItems(await r.json())
        })
    }, [userID])

    return items
}
