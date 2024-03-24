package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/abibby/fileserver"
	"github.com/abibby/salusa/auth"
	"github.com/abibby/salusa/di"
	"github.com/abibby/salusa/email"
	"github.com/abibby/salusa/request"
	"github.com/abibby/salusa/router"
	"github.com/abibby/salusa/salusadi"
	"github.com/abibby/wishist/config"
	"github.com/abibby/wishist/controller"
	"github.com/abibby/wishist/db"
	"github.com/abibby/wishist/dep"
	"github.com/abibby/wishist/ui"
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
	r := router.New()
	salusadi.Register[*db.User](dep.DP)
	di.RegisterSingleton(dep.DP, func() email.Mailer {
		return config.Email.Mailer()
	})
	r.Register(dep.DP)

	r.WithDependencyProvider(dep.DP)
	r.Use(request.HandleErrors())
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
	// broken
	// r.Use(controller.ErrorMiddleware())

	type CreateUserRequest struct {
		Username string `json:"username" validate:"required"`
		Email    string `json:"email" validate:"required|email"`
		Name     string `json:"name" validate:"required"`
	}
	auth.RegisterRoutes(r, func(r *CreateUserRequest) *db.User {
		return &db.User{
			Username: r.Username,
			Email:    r.Email,
			Name:     r.Name,
			Password: []byte{},
		}
	})
	// Post.Handle("/user/passwordless", controller.CreateUserPasswordless)

	r.Group("", func(r *router.Router) {

		r.Use(auth.AttachUser())

		r.Get("/item", controller.ItemList)

		r.Group("", func(r *router.Router) {
			r.Use(auth.LoggedIn())

			// r.Group("", func(r *router.Router) {
			// 	r.Use(HasPurpose(controller.PurposeRefresh))
			// 	r.Post("/refresh", controller.Refresh)
			// })

			r.Group("", func(r *router.Router) {
				// r.Use(HasPurpose(controller.PurposeAuthorize))

				r.Group("/item", func(r *router.Router) {
					r.Post("", controller.ItemCreate)
					r.Put("", controller.ItemUpdate)
					r.Delete("", controller.ItemDelete)
				})

				r.Group("/friend", func(r *router.Router) {
					r.Get("", controller.FriendList)
					r.Post("", controller.FriendCreate)
					r.Delete("", controller.FriendDelete)
				})

				r.Group("/user-item", func(r *router.Router) {
					r.Get("", controller.UserItemList)
					r.Post("", controller.UserItemCreate)
					r.Put("", controller.UserItemUpdate)
					r.Delete("", controller.UserItemDelete)
				})
			})
		})
	})
	r.Handle("/", fileserver.WithFallback(ui.Content, "dist", "index.html", nil))

	slog.Info("Listening on http://localhost:32148")
	http.ListenAndServe(":32148", r)
}
