import { Fragment, h } from 'preact'
import { useUser } from '../auth'
import { PageSpinner } from '../components/spinner'
import { useLocation } from 'preact-iso'
import styles from './home.module.css'
import { useCallback } from 'preact/hooks'
import { useOpenModal } from '../components/modal'

export function Home() {
    const [user, userLoading] = useUser()
    const { route } = useLocation()
    const openModal = useOpenModal()

    const login = useCallback(async () => {
        openModal('/login')
    }, [openModal])

    if (userLoading) {
        return <PageSpinner />
    }
    if (user === null) {
        return (
            <Fragment>
                <h1>Wishist</h1>
                <p>
                    <button class={styles.login} onClick={login}>
                        Login
                    </button>{' '}
                    to view friends and create a wishlist
                </p>
            </Fragment>
        )
    }

    route(`/list/${user?.username}`, true)

    return <Fragment />
}
