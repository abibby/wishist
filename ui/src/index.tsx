import { h, render } from 'preact'
import Router, { Route } from 'preact-router'
import { ModalController } from './components/modal'
import { Default } from './layouts/default'
import './main.css'
import { CreateUser } from './pages/create-user'
import { Error404 } from './pages/error-404'
import { Home } from './pages/home'
import { List } from './pages/list'

h

function Main() {
    return (
        <Default>
            <ModalController />
            <Router>
                <Route component={Home} path='/' />
                <Route component={CreateUser} path='/create-user' />
                <Route component={List} path='/list/:username' />
                <Route component={Error404} default />
            </Router>
        </Default>
    )
}
render(<Main />, document.getElementById('app')!)
