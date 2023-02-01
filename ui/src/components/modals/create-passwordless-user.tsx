import { h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { userCreatePasswordless } from '../../auth'
import { Input } from '../form/input'
import { Modal, ModalActions, ModalProps } from '../modal'

h

interface CreatePasswordlessUserProps extends ModalProps {}

export function CreatePasswordlessUser({ close }: CreatePasswordlessUserProps) {
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

        close()
    }, [name, user])
    return (
        <Modal title='Create User' close={close}>
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
