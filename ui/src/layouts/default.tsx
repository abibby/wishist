import { h, RenderableProps } from 'preact'
import { useCallback } from 'preact/hooks'
import { useUser } from '../auth'
import { useOpenModal } from '../components/modal'
import styles from './default.module.css'

export function Default({ children }: RenderableProps<unknown>) {
    const [user] = useUser()
    const openModal = useOpenModal()

    const login = useCallback(async () => {
        openModal('/login')
    }, [openModal])

    return (
        <div class={styles.default}>
            <nav class={styles.nav}>
                <a class={styles.home} href='/'>
                    Wishist
                </a>
                {user ? (
                    <a class={styles.logout} href='/account'>
                        Account
                    </a>
                ) : (
                    <button class={styles.login} onClick={login}>
                        login
                    </button>
                )}
            </nav>
            {children}
        </div>
    )
}
