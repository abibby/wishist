package main

import (
	"log"
	"net/http"

	"github.com/abibby/fileserver"
	"github.com/abibby/wishlist/auth"
	"github.com/abibby/wishlist/config"
	"github.com/abibby/wishlist/controller"
	"github.com/abibby/wishlist/db"
	"github.com/abibby/wishlist/ui"
	"github.com/gorilla/mux"
)

func main() {
	err := config.Init()
	if err != nil {
		log.Fatal("failed initialize config ", err)
	}

	err = db.Migrate()
	if err != nil {
		log.Fatal("failed to migrate database ", err)
	}

	err = db.Open()
	if err != nil {
		log.Fatal("failed to open database ", err)
	}

	r := mux.NewRouter()

	r.Handle("/login", controller.Login).Methods("POST")
	r.Handle("/user", controller.CreateUser).Methods("PUT")

	Group(r.NewRoute(), func(r *mux.Router) {
		r.Use(auth.Middleware, HasPurpose(controller.PurposeRefresh))
		r.Handle("/refresh", controller.Refresh).Methods("POST")
	})
	Group(r.NewRoute(), func(r *mux.Router) {
		r.Use(auth.Middleware, HasPurpose(controller.PurposeAuthorize))

		Group(r.PathPrefix("/item"), func(r *mux.Router) {
			r.Handle("", controller.ItemList).Methods("GET")
			r.Handle("", controller.ItemCreate).Methods("POST")
			r.Handle("", controller.ItemUpdate).Methods("PUT")
			r.Handle("", controller.ItemDelete).Methods("DELETE")
		})

		Group(r.PathPrefix("/friend"), func(r *mux.Router) {
			r.Handle("", controller.FriendList).Methods("GET")
			r.Handle("", controller.FriendCreate).Methods("POST")
			r.Handle("", controller.FriendDelete).Methods("DELETE")
		})
	})

	r.PathPrefix("/").
		Handler(fileserver.WithFallback(ui.Content, "dist", "index.html", nil)).
		Methods("GET")

	log.Print("Listening on http://localhost:32148")
	http.ListenAndServe(":32148", r)
}

func Group(r *mux.Route, cb func(r *mux.Router)) {
	cb(r.Subrouter())
}

func HasPurpose(p controller.Purpose) mux.MiddlewareFunc {
	return auth.HasClaim("purpose", string(p))
}
