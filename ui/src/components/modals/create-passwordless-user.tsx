import { h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { userCreatePasswordless } from '../../auth'
import { Input } from '../form/input'
import { Modal, ModalActions, ModalProps } from '../modal'
import styles from './create-passwordless-user.module.css'

h

interface CreatePasswordlessUserProps extends ModalProps<boolean> {
    message?: string
}

export function CreatePasswordlessUser({
    message,
    close,
}: CreatePasswordlessUserProps) {
    const [name, setName] = useState('')
    const [user, setUser] = useState('')
    const createUser = useCallback(async () => {
        await userCreatePasswordless({
            name: name,
            username: user,
        })

        close(true)
    }, [name, user])

    return (
        <Modal title='Create Instant Account' close={close}>
            {message && <p class={styles.subtitle}>{message}</p>}
            <Input
                title='Username'
                type='text'
                value={user}
                onInput={setUser}
            />
            <Input title='Name' type='text' value={name} onInput={setName} />

            <ModalActions>
                <button onClick={createUser}>Create User</button>
            </ModalActions>
        </Modal>
    )
}
