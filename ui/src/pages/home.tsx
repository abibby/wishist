import { h } from 'preact'
import { Link } from 'preact-router'

h

export function Home() {
    return (
        <div>
            <h1>Wishlist</h1>
            <Link href={'/list/adam'}>List</Link>
        </div>
    )
}
