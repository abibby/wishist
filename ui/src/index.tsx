import { Fragment, h, render } from 'preact'
import Router, { Route } from 'preact-router'
import { ModalController } from './components/modal'
import './main.css'
import { CreatePasswordlessUser } from './pages/create-passwordless-user'
import { CreateUser } from './pages/create-user'
import { Error404 } from './pages/error-404'
import { Home } from './pages/home'
import { List } from './pages/list'
import { Login } from './pages/login'

h

function Main() {
    return (
        <Fragment>
            <ModalController />
            <Router>
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
        </Fragment>
    )
}
render(<Main />, document.getElementById('app')!)
