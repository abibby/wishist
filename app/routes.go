package app

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/abibby/salusa/auth"
	"github.com/abibby/salusa/fileserver"
	"github.com/abibby/salusa/openapidoc"
	"github.com/abibby/salusa/request"
	"github.com/abibby/salusa/router"
	"github.com/abibby/wishist/controller"
	"github.com/abibby/wishist/db"
	"github.com/abibby/wishist/ui"
	"github.com/golang-jwt/jwt/v4"
)

type CreateUserRequest struct {
	Username string `json:"username" validate:"required"`
	Email    string `json:"email" validate:"required|email"`
	Name     string `json:"name" validate:"required"`
}

type Claims struct {
	auth.Claims
	Name     string `json:"name"`
	Username string `json:"preferred_username"`
}

type StatusRecorder struct {
	http.ResponseWriter
	Status int
}

func NewStatusRecorder(w http.ResponseWriter) *StatusRecorder {
	return &StatusRecorder{
		Status:         200,
		ResponseWriter: w,
	}
}

func InitRoutes(r *router.Router) {
	r.Use(request.HandleErrors(
		func(err error) {
			slog.Warn("request failed", "error", err)
		},
	))

	r.UseFunc(func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			s := time.Now()
			sr := NewStatusRecorder(w)
			h.ServeHTTP(sr, r)

			slog.Info("request",
				"remote_address", r.RemoteAddr,
				"path", r.URL.String(),
				"method", r.Method,
				"time", time.Since(s),
				"status", sr.Status,
			)
		})
	})
	r.Group("/api", func(r *router.Router) {
		r.Use(auth.AttachUser())

		auth.RegisterRoutes(r, auth.NewBasicAuthController[*db.User](
			auth.NewUser(func(r *CreateUserRequest) *db.User {
				return &db.User{
					Username: r.Username,
					Email:    r.Email,
					Name:     r.Name,
					Password: []byte{},
				}
			}),
			auth.AccessTokenOptions(func(u *db.User, claims *auth.Claims) jwt.Claims {
				return &Claims{
					Claims:   *claims,
					Username: u.Username,
					Name:     u.Name,
				}
			}),
		))

		r.Get("/login", http.RedirectHandler("/?m=/login", http.StatusFound)).Name("login")

		r.Get("/item", controller.ItemList).Name("item.list")
		r.Get("/user", controller.UserList).Name("user.list")

		r.Group("", func(r *router.Router) {
			r.Use(auth.LoggedIn())

			r.Get("/user/current", controller.GetCurrentUser).Name("user.current")

			r.Group("/item", func(r *router.Router) {
				r.Post("", controller.ItemCreate).Name("item.create")
				r.Put("", controller.ItemUpdate).Name("item.update")
				r.Delete("", controller.ItemDelete).Name("item.delete")
			})

			r.Group("/friend", func(r *router.Router) {
				r.Get("", controller.FriendList).Name("friend.list")
				r.Post("", controller.FriendCreate).Name("friend.create")
				r.Delete("", controller.FriendDelete).Name("friend.delete")
			})

			r.Group("/user-item", func(r *router.Router) {
				r.Get("", controller.UserItemList).Name("user-item.list")
				r.Post("", controller.UserItemCreate).Name("user-item.create")
				r.Put("", controller.UserItemUpdate).Name("user-item.update")
				r.Delete("", controller.UserItemDelete).Name("user-item.delete")
			})
		})

		r.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(404)
		}))
	})
	r.Handle("/docs", openapidoc.SwaggerUI())
	r.Handle("/", fileserver.WithFallback(ui.Content, "dist", "index.html", nil))
}
