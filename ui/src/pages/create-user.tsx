import { Fragment, h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { Input } from '../components/form/input'
import { FetchError } from '../api/internal'
import { user } from '../api'
import { Form } from '../components/form/form'
import { bind } from '@zwzn/spicy'
import { useLocation } from 'preact-iso'

h

export function CreateUser() {
    const { route } = useLocation()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [username, setUser] = useState('')
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')
    const [running, setRunning] = useState(false)

    const submit = useCallback(async () => {
        if (running) {
            return
        }
        if (password1 !== password2) {
            throw new FetchError('', 0, {
                error: '',
                status: 0,
                fields: {
                    password: ['Passwords do not match'],
                },
            })
        }
        setRunning(true)
        await user.create({
            name: name,
            email: email,
            username: username,
            password: password1,
        })
        route('/awaiting-verification')
    }, [running, password1, password2, name, email, username, route])

    return (
        <Fragment>
            <h1>Create User</h1>
            <Form onSubmit={submit} onCleanup={bind(false, setRunning)}>
                <Input
                    title='Username'
                    type='text'
                    value={username}
                    onInput={setUser}
                    name='username'
                    autoFocus
                />
                <Input
                    title='Email'
                    type='text'
                    value={email}
                    onInput={setEmail}
                    name='email'
                />
                <Input
                    title='Full Name'
                    type='text'
                    value={name}
                    onInput={setName}
                    name='name'
                />
                <Input
                    title='Password'
                    type='password'
                    value={password1}
                    onInput={setPassword1}
                    name='password'
                />
                <Input
                    title='Reenter Password'
                    type='password'
                    value={password2}
                    onInput={setPassword2}
                    name='password2'
                />
                <button type='submit' disabled={running}>
                    {running ? 'Creating user...' : 'Create User'}
                </button>
            </Form>
        </Fragment>
    )
}
