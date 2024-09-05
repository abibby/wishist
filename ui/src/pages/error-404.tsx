import { Fragment, h } from 'preact'

export function Error404() {
    return (
        <Fragment>
            <h1>404 Page not found</h1>
            <a href={'/'}>Home</a>
        </Fragment>
    )
}
