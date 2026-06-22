import { h, RenderableProps } from 'preact'
import { useCallback } from 'preact/hooks'
import { useUser } from '../auth'
import { useOpenModal } from '../components/modal'
import styles from './default.module.css'
import { List, Users, User, Settings } from 'preact-feather'

export function Default({ children }: RenderableProps<unknown>) {
    const [user] = useUser()
    const openModal = useOpenModal()

    const login = useCallback(async () => {
        openModal('/login')
    }, [openModal])

    const userListPath = `/list/${user?.username}`

    return (
        <div class={styles.default}>
            {user ? (
                <nav class={styles.nav}>
                    <a href={userListPath}>
                        <List />
                    </a>
                    <a href='/friends'>
                        <Users />
                    </a>
                    <a href='/account'>
                        <Settings />
                    </a>
                </nav>
            ) : (
                <button class={styles.login} onClick={login}>
                    <User />
                </button>
            )}
            {children}
        </div>
    )
}
