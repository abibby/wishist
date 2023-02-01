import { Fragment, h } from 'preact'
import { Link } from 'preact-router'

h

export function Error404() {
    return (
        <Fragment>
            <h1>404 Page not found</h1>
            <Link href={'/'}>Home</Link>
        </Fragment>
    )
}
