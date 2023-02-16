import { h, RenderableProps } from 'preact'
import { Link } from 'preact-router'
import { useCallback } from 'preact/hooks'
import { logout, useUser } from '../auth'
import { openModal } from '../components/modal'
import { Ask } from '../components/modals/ask'
import { LoginModal } from '../components/modals/login'
import styles from './default.module.css'

h

export function Default({ children }: RenderableProps<{}>) {
    const user = useUser()
    const passwordless = user?.passwordless

    const login = useCallback(async () => {
        await openModal(LoginModal, {})
    }, [])

    const tryLogout = useCallback(async () => {
        if (passwordless) {
            const continueLogout = await openModal(Ask, {
                title: 'Logout?',
                question:
                    "You are on an instant account, you won't be able to login once you have logged out. Are you sure you want to continue",
            })
            if (!continueLogout) {
                return
            }
        }
        await logout()
    }, [passwordless])

    return (
        <div class={styles.default}>
            <nav class={styles.nav}>
                <Link class={styles.home} href='/'>
                    Wishist
                </Link>
                {user ? (
                    <button class={styles.logout} onClick={tryLogout}>
                        logout
                    </button>
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
