import { h, RenderableProps } from 'preact'
import { Link, route } from 'preact-router'
import { logout } from '../auth'

h

async function logoutAndRedirect() {
    await logout()
    route('/login')
}

export function Default({ children }: RenderableProps<{}>) {
    return (
        <div>
            <nav>
                <Link href='/'>Home</Link>
                <button onClick={logoutAndRedirect}>logout</button>
            </nav>
            {children}
        </div>
    )
}
