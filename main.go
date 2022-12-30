package main

import (
	"log"
	"net/http"

	"github.com/abibby/fileserver"
	"github.com/abibby/wishlist/ui"
	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()
	r.PathPrefix("/").
		Handler(fileserver.WithFallback(ui.Content, "dist", "index.html", nil)).
		Methods("GET")

	log.Print("Listening on http://localhost:32148")
	http.ListenAndServe(":32148", r)
}
