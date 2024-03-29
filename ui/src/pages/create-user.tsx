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
    const [running, setRunning] = useState(false)
    const submit = useCallback(
        async (e: Event) => {
            e.preventDefault()
            if (running) {
                return
            }
            if (password1 !== password2) {
                setError('passwords do not match')
                return
            }
            setRunning(true)
            try {
                await userCreate({
                    name: name,
                    email: email,
                    username: user,
                    password: password1,
                })
                route('/awaiting-verification')
            } catch (e) {
                if (e instanceof FetchError) {
                    setError(e.body.error)
                } else {
                    throw e
                }
            } finally {
                setRunning(false)
            }
        },
        [running, name, user, email, password1, password2, setError],
    )
    return (
        <Fragment>
            <h1>Create User</h1>
            <form onSubmit={submit}>
                <Input
                    title='username'
                    type='text'
                    value={user}
                    onInput={setUser}
                />
                <Input
                    title='email'
                    type='text'
                    value={email}
                    onInput={setEmail}
                />
                <Input
                    title='Full Name'
                    type='text'
                    value={name}
                    onInput={setName}
                />
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
                <button type='submit' disabled={running}>
                    {running ? 'Creating user...' : 'Create User'}
                </button>
            </form>
        </Fragment>
    )
}
