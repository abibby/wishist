import { Fragment, h } from 'preact'
import { route } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { userCreate } from '../api/user'
import { Input } from '../components/form/input'
import { login } from '../auth'
import { FetchError } from '../api/internal'
import styles from './create-user.module.css'

h

export function CreateUser() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [user, setUser] = useState('')
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')
    const [error, setError] = useState<string>()
    const clickCreateUser = useCallback(async () => {
        try {
            if (password1 !== password2) {
                setError('passwords do not match')
                return
            }
            await userCreate({
                name: name,
                email: email,
                username: user,
                password: password1,
            })
            await login(user, password1)
            const u = new URL(location.href).searchParams.get('redirect')
            route(u ?? '/')
        } catch (e) {
            if (e instanceof FetchError) {
                setError(e.body.error)
            }
        }
    }, [name, user, password1, password2, setError])
    return (
        <Fragment>
            <h1>Create User</h1>
            <Input
                title='username'
                type='text'
                value={user}
                onInput={setUser}
            />
            <Input title='email' type='text' value={email} onInput={setEmail} />
            <Input title='Name' type='text' value={name} onInput={setName} />
            <Input
                title='Password'
                type='password'
                value={password1}
                onInput={setPassword1}
            />
            <Input
                title='Reenter Password'
                type='password'
                value={password2}
                onInput={setPassword2}
            />
            {error && <p class={styles.error}>{error}</p>}
            <button onClick={clickCreateUser}>Create User</button>
        </Fragment>
    )
}
