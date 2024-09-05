//go:build test

package routes

import (
	"net/http"

	"github.com/abibby/salusa/router"
	"github.com/abibby/wishist/controller"
)

func testRoutes(r *router.Router) {
	r.Get("/reset-database", http.HandlerFunc(controller.TestResetDatabase))
}
