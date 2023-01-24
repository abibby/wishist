import { h } from 'preact'
import { Link, route } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { login } from '../auth'
import { Input } from '../components/form/input'
import { Default } from '../layouts/default'

h

export function Login() {
    const [user, setUser] = useState('')
    const [password, setPassword] = useState('')
    const clickLogin = useCallback(async () => {
        await login(user, password)
        route('/')
    }, [user, password])
    return (
        <Default>
            <h1>Login</h1>
            <Input
                title='Username'
                type='text'
                value={user}
                onInput={setUser}
            />
            <Input
                title='Password'
                type='password'
                value={password}
                onInput={setPassword}
            />
            <button onClick={clickLogin}>Login</button>

            <Link href='/create-user'>Create User</Link>
        </Default>
    )
}
