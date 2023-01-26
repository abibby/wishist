import { h } from 'preact'
import { route } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { userCreatePasswordless } from '../auth'
import { Input } from '../components/form/input'
import { Default } from '../layouts/default'

h

export function CreatePasswordlessUser() {
    const [name, setName] = useState('')
    const [user, setUser] = useState('')
    const createUser = useCallback(async () => {
        const token = location.hash.slice(1)
        if (token.length === 0) {
            return
        }
        await userCreatePasswordless(token, {
            name: name,
            username: user,
        })

        route('/')
    }, [name, user])
    return (
        <Default>
            <h1>Create User</h1>
            <Input
                title='Username'
                type='text'
                value={user}
                onInput={setUser}
            />
            <Input title='Name' type='text' value={name} onInput={setName} />

            <button onClick={createUser}>Create User</button>
        </Default>
    )
}
