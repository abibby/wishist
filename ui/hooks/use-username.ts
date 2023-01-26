import { useEffect, useState } from 'preact/hooks'
import { username } from '../src/auth'

export function useUsername(): string | undefined {
    const [user, setUser] = useState<string>()

    useEffect(() => {
        username().then(user => setUser(user))
    }, [setUser])
    return user
}
