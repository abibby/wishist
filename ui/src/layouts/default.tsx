import { h, RenderableProps } from 'preact'
import { Link, route } from 'preact-router'
import { logout, useUser } from '../auth'
import styles from './default.module.css'

h

async function logoutAndRedirect() {
    await logout()
    route('/login')
}

export function Default({ children }: RenderableProps<{}>) {
    const user = useUser()
    console.log(user)

    return (
        <div class={styles.default}>
            <nav class={styles.nav}>
                <Link class={styles.home} href='/'>
                    Wishist
                </Link>
                {user && (
                    <button class={styles.logout} onClick={logoutAndRedirect}>
                        logout
                    </button>
                )}
            </nav>
            {children}
        </div>
    )
}
