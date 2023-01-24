import { h } from 'preact'
import { Link } from 'preact-router'
import { Default } from '../layouts/default'

h

export function Error404() {
    return (
        <Default>
            <h1>404 Page not found</h1>
            <Link href={'/'}>Home</Link>
        </Default>
    )
}
