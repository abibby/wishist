import { h, render } from 'preact'
import Router, { route, Route, RouterOnChangeArgs } from 'preact-router'
import { getToken } from './auth'
import './main.css'
import { CreatePasswordlessUser } from './pages/create-passwordless-user'
import { CreateUser } from './pages/create-user'
import { Error404 } from './pages/error-404'
import { Home } from './pages/home'
import { List } from './pages/list'
import { Login } from './pages/login'

h

async function routeChange({ path }: RouterOnChangeArgs) {
    const unauthenticatedRoutes = [
        '/login',
        '/create-user',
        '/create-user/passwordless',
    ]
    const token = await getToken()

    if (
        token === null &&
        path !== null &&
        !unauthenticatedRoutes.includes(path)
    ) {
        route('/login')
    }
}

function Main() {
    return (
        <Router onChange={routeChange}>
            <Route component={Home} path='/' />
            <Route component={Login} path='/login' />
            <Route component={CreateUser} path='/create-user' />
            <Route component={List} path='/list/:name' />
            <Route
                component={CreatePasswordlessUser}
                path='/create-user/passwordless'
            />
            <Route component={Error404} default />
        </Router>
    )
}
render(<Main />, document.getElementById('app')!)
