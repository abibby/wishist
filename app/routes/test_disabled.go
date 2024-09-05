//go:build !test

package routes

import "github.com/abibby/salusa/router"

var testRoutes func(r *router.Router)
