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

	Group(r.NewRoute().Subrouter(), func(r *mux.Router) {
		r.Use(auth.Middleware)
		r.Handle("/list", controller.ListItems).Methods("GET")
		r.Handle("/list/edit", controller.EditItem).Methods("POST")
		r.Handle("/list/add", controller.AddItem).Methods("POST")
		r.Handle("/list/remove", controller.RemoveItem).Methods("POST")
	})

	r.PathPrefix("/").
		Handler(fileserver.WithFallback(ui.Content, "dist", "index.html", nil)).
		Methods("GET")

	log.Print("Listening on http://localhost:32148")
	http.ListenAndServe(":32148", r)
}

func Group(r *mux.Router, cb func(r *mux.Router)) {
	cb(r)
}
