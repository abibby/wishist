package main

import (
	"context"
	"embed"
	"fmt"
	"mime"
	"net"
	"net/http"
	"net/netip"
	"os"
	"strings"
	"sync"
	"time"

	"abibby.com/salusa/auth"
	"abibby.com/salusa/clog"
	"abibby.com/salusa/database"
	"abibby.com/salusa/di"
	"abibby.com/salusa/email"
	"abibby.com/salusa/request"
	"abibby.com/salusa/router"
	"abibby.com/salusa/salusaconfig"
	"abibby.com/salusa/view"
	"github.com/abibby/fileserver"
	"github.com/abibby/wishist/config"
	"github.com/abibby/wishist/controller"
	"github.com/abibby/wishist/db"
	"github.com/abibby/wishist/db/migrations"
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

//go:embed emails/*
var emails embed.FS

func main() {
	ctx := di.ContextWithDependencyProvider(
		context.Background(),
		di.NewDependencyProvider(),
	)
	clog.RegisterDefault(ctx)

	err := config.Init()
	if err != nil {
		clog.Use(ctx).Error("failed initialize config", "error", err)
		os.Exit(1)
	}

	err = view.Register(emails, "**/*.html")(ctx)
	if err != nil {
		clog.Use(ctx).Error("failed register emails", "error", err)
		os.Exit(1)
	}

	di.RegisterSingleton(ctx, func() salusaconfig.Config {
		return config.Config
	})

	email.Register(ctx, config.Email)
	database.Register(ctx, config.Config.DBConfig(), migrations.Use())
	database.RegisterTransactions(ctx, &sync.RWMutex{})

	request.Register(ctx)
	auth.Register[*db.User](ctx)

	auth.SetAppKey(config.AppKey)

	err = mime.AddExtensionType(".webmanifest", "application/manifest+json")
	if err != nil {
		clog.Use(ctx).Error("failed to add .webmanifest mimetype", "error", err)
		os.Exit(1)
	}

	r := router.New()

	r.Register(ctx)

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

			remoteAddr := r.RemoteAddr
			if config.RemoteAddressHeader != "" && isTrustedAddress(r.RemoteAddr) {
				remoteAddr = r.Header.Get(config.RemoteAddressHeader)
			}

			clog.Use(ctx).Info("request",
				"remote_address", remoteAddr,
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
			// auth.CreateUser(func(r *CreateUserRequest, c *auth.BasicAuthController[*db.User]) *db.User {
			// 	return &db.User{
			// 		Username: r.Username,
			// 		Email:    r.Email,
			// 		Name:     r.Name,
			// 		Password: []byte{},
			// 	}
			// }),
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
		r.Put("/user", controller.UserUpdate)

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
	r.Handle("/", fileserver.WithFallback(ui.Content, "dist", "index.html", nil))

	r.UseFunc(func(h http.Handler) http.Handler {
		time.Sleep(time.Second)
		return h
	})

	err = r.Validate(ctx)
	if err != nil {
		clog.Use(ctx).Error("router validation failed", "err", err)
	}

	clog.Use(ctx).Info("Listening on " + config.Config.GetBaseURL())

	s := &http.Server{
		Addr:    fmt.Sprintf(":%d", config.Port),
		Handler: r,
		BaseContext: func(l net.Listener) context.Context {
			return ctx
		},
	}

	err = s.ListenAndServe()
	if err != nil {
		clog.Use(ctx).Error("http server failed", "error", err)
		os.Exit(1)
	}
}

func isTrustedAddress(address string) bool {
	if config.TrustedIP == "*" {
		return true
	}
	parts := strings.Split(address, ":")
	ip := parts[0]

	prefix, err := netip.ParsePrefix(config.TrustedIP)
	if err != nil {
		return config.TrustedIP == ip
	}

	addr, err := netip.ParseAddr(ip)
	if err != nil {
		return false
	}

	return prefix.Contains(addr)
}
