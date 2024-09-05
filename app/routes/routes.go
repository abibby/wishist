package routes

import (
	"context"
	"net/http"
	"time"

	"github.com/abibby/fileserver"
	"github.com/abibby/salusa/auth"
	"github.com/abibby/salusa/clog"
	"github.com/abibby/salusa/request"
	"github.com/abibby/salusa/router"
	"github.com/abibby/wishist/controller"
	"github.com/abibby/wishist/db"
	"github.com/abibby/wishist/ui"
	"github.com/golang-jwt/jwt/v4"
)

type CreateUserRequest struct {
	auth.UserCreateRequest
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

func (w *StatusRecorder) WriteHeader(statusCode int) {
	w.Status = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func InitRoutes(r *router.Router) {

	r.Use(request.DIMiddleware())
	r.Use(request.HandleErrors(
		func(ctx context.Context, err error) http.Handler {
			clog.Use(ctx).Warn("request failed", "error", err)
			return nil
		},
	))

	r.Use(router.MiddlewareFunc(func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			s := time.Now()
			sr := NewStatusRecorder(w)
			h.ServeHTTP(sr, r)

			remote := r.Header.Get("X-Forwarded-For")
			if remote == "" {
				remote = r.RemoteAddr
			}
			clog.Use(r.Context()).Info("request",
				"remote_address", remote,
				"path", r.URL.String(),
				"method", r.Method,
				"time", time.Since(s),
				"status", sr.Status,
			)
		})
	}))

	r.Group("/api", func(r *router.Router) {
		r.Use(auth.AttachUser())

		auth.RegisterRoutes(r, auth.NewBasicAuthController[*db.User](
			auth.CreateUser(func(r *CreateUserRequest, c *auth.BasicAuthController[*db.User]) (*auth.UserCreateResponse[*db.User], error) {
				return c.RunUserCreate(&db.User{
					Username: r.Username,
					Email:    r.Email,
					Name:     r.Name,
					Password: []byte{},
				}, &r.UserCreateRequest)
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

		r.Get("/item", controller.ItemList)
		r.Get("/user", controller.UserList)

		r.Group("", func(r *router.Router) {
			r.Use(auth.LoggedIn())

			r.Get("/user/current", controller.GetCurrentUser)

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
		r.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(404)
		}))
	})

	if testRoutes != nil {
		r.Group("/test", testRoutes)
	}

	r.Handle("/", fileserver.WithFallback(ui.Content, "dist", "index.html", nil))
}
