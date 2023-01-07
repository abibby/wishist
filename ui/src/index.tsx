import { h, render } from 'preact'
import Router, { route, Route, RouterOnChangeArgs } from 'preact-router'
import { useCallback } from 'preact/hooks'
import { getToken } from './auth'
import { Error404 } from './pages/error-404'
import { Home } from './pages/home'
import { List } from './pages/list'
import { Login } from './pages/login'

h

function Main() {
    const routeChange = useCallback(async ({ path }: RouterOnChangeArgs) => {
        const token = await getToken()
        if (token === null && path !== '/login') {
            route('/login')
        }
    }, [])

    return (
        <Router onChange={routeChange}>
            <Route component={Home} path='/' />
            <Route component={Login} path='/login' />
            <Route component={List} path='/list/:name' />
            <Route component={Error404} default />
        </Router>
    )
}

render(<Main />, document.getElementById('app')!)

async function main() {
    // await fetch('/user', {
    //     method: 'PUT',
    //     body: JSON.stringify({ username: 'adam', password: 'test' }),
    // })

    await fetch('/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'adam', password: 'test' }),
    })
}

main()
