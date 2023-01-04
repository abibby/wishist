import { h } from 'preact'
import { Link } from 'preact-router'

h

export function Error404() {
    return (
        <div>
            <h1>404 Page not found</h1>
            <Link href={'/'}>Home</Link>
        </div>
    )
}
