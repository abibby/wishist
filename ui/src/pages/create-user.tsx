import { Fragment, h } from 'preact'
import { route } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { userCreate } from '../api/user'
import { Input } from '../components/form/input'
import { login } from '../auth'
import { ErrorBody, FetchError, ValidationErrorBody } from '../api/internal'
import styles from './create-user.module.css'

h

export function CreateUser() {
    const [name, setName] = useState('')
    const [user, setUser] = useState('')
    const [email, setEmail] = useState('')
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')
    const [error, setError] = useState<Partial<ValidationErrorBody>>()
    const clickCreateUser = useCallback(async () => {
        try {
            if (password1 !== password2) {
                setError({
                    error: 'passwords do not match',
                })
                return
            }
            await userCreate({
                name: name,
                username: user,
                email: email,
                password: password1,
            })
            await login(user, password1)
            const u = new URL(location.href).searchParams.get('redirect')
            route(u ?? '/')
        } catch (e) {
            if (e instanceof FetchError) {
                setError(e.body)
            }
        }
    }, [name, user, email, password1, password2, setError])
    return (
        <Fragment>
            <h1>Create User</h1>
            <Input
                title='username'
                type='text'
                value={user}
                onInput={setUser}
                error={error?.fields?.username}
            />
            <Input
                title='Name'
                type='text'
                value={name}
                onInput={setName}
                error={error?.fields?.name}
            />
            <Input
                title='Email'
                type='text'
                value={email}
                onInput={setEmail}
                error={error?.fields?.email}
            />
            <Input
                title='Password'
                type='password'
                value={password1}
                onInput={setPassword1}
                error={error?.fields?.password}
            />
            <Input
                title='Reenter Password'
                type='password'
                value={password2}
                onInput={setPassword2}
            />
            {error && error.error !== 'validation error' && (
                <p class={styles.error}>{error.error}</p>
            )}
            <button onClick={clickCreateUser}>Create User</button>
        </Fragment>
    )
}
