package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/abibby/fileserver"
	"github.com/abibby/salusa/auth"
	"github.com/abibby/wishist/config"
	"github.com/abibby/wishist/controller"
	"github.com/abibby/wishist/db"
	"github.com/abibby/wishist/ui"
	"github.com/gorilla/mux"
)

type ResponseWriter struct {
	http.ResponseWriter
	Status int
}

func (w *ResponseWriter) WriteHeader(statusCode int) {
	w.Status = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func main() {
	err := config.Init()
	if err != nil {
		slog.Error("failed initialize config ", err)
		os.Exit(1)
	}

	err = db.Migrate()
	if err != nil {
		slog.Error("failed to migrate database ", err)
		os.Exit(1)
	}

	auth.SetAppKey(config.AppKey)

	err = db.Open()
	if err != nil {
		slog.Error("failed to open database ", err)
		os.Exit(1)
	}

	r := mux.NewRouter()
	r.Use(func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			s := time.Now()
			rw := &ResponseWriter{ResponseWriter: w, Status: 200}

			h.ServeHTTP(rw, r)

			slog.Info("request",
				"remote_address", r.RemoteAddr,
				"path", r.URL.String(),
				"method", r.Method,
				"time", time.Since(s),
				"status", rw.Status,
			)
		})
	})

	r.Handle("/login", controller.Login).Methods("POST")
	r.Handle("/user", controller.CreateUser).Methods("POST")
	r.Handle("/user/passwordless", controller.CreateUserPasswordless).Methods("POST")

	Group(r.NewRoute(), func(r *mux.Router) {
		r.Use(auth.AttachUser)

		r.Handle("/item", controller.ItemList).Methods("GET")

		Group(r.NewRoute(), func(r *mux.Router) {
			r.Use(auth.LoggedIn)

			Group(r.NewRoute(), func(r *mux.Router) {
				r.Use(HasPurpose(controller.PurposeRefresh))
				r.Handle("/refresh", controller.Refresh).Methods("POST")
			})

			Group(r.NewRoute(), func(r *mux.Router) {
				r.Use(HasPurpose(controller.PurposeAuthorize))

				Group(r.PathPrefix("/item"), func(r *mux.Router) {
					r.Handle("", controller.ItemCreate).Methods("POST")
					r.Handle("", controller.ItemUpdate).Methods("PUT")
					r.Handle("", controller.ItemDelete).Methods("DELETE")
				})

				Group(r.PathPrefix("/friend"), func(r *mux.Router) {
					r.Handle("", controller.FriendList).Methods("GET")
					r.Handle("", controller.FriendCreate).Methods("POST")
					r.Handle("", controller.FriendDelete).Methods("DELETE")
				})

				Group(r.PathPrefix("/user-item"), func(r *mux.Router) {
					r.Handle("", controller.UserItemList).Methods("GET")
					r.Handle("", controller.UserItemCreate).Methods("POST")
					r.Handle("", controller.UserItemUpdate).Methods("PUT")
					r.Handle("", controller.UserItemDelete).Methods("DELETE")
				})
			})
		})
	})

	r.PathPrefix("/").
		Handler(fileserver.WithFallback(ui.Content, "dist", "index.html", nil)).
		Methods("GET")

	slog.Info("Listening on http://localhost:32148")
	http.ListenAndServe(":32148", r)
}

func Group(r *mux.Route, cb func(r *mux.Router)) {
	cb(r.Subrouter())
}

func HasPurpose(p controller.Purpose) mux.MiddlewareFunc {
	return auth.HasClaim("purpose", string(p))
}
