import { h } from 'preact'
import { route } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { userCreate } from '../api/user'
import { Input } from '../components/form/input'
import { Default } from '../layouts/default'

h

export function CreateUser() {
    const [name, setName] = useState('')
    const [user, setUser] = useState('')
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')
    const clickLogin = useCallback(async () => {
        await userCreate({
            name: name,
            username: user,
            password: password1,
        })
        route('/login')
    }, [name, user, password1, password2])
    return (
        <Default>
            <h1>Login</h1>
            <Input title='user' type='text' value={user} onInput={setUser} />
            <Input title='name' type='text' value={name} onInput={setName} />
            <Input
                title='password1'
                type='password'
                value={password1}
                onInput={setPassword1}
            />
            <Input
                title='password2'
                type='password'
                value={password2}
                onInput={setPassword2}
            />
            <button onClick={clickLogin}>Login</button>
        </Default>
    )
}
