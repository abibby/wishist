package main

import (
	"context"
	"embed"
	"fmt"
	"log/slog"
	"mime"
	"net"
	"net/http"
	"os"

	"github.com/abibby/salusa/auth"
	"github.com/abibby/salusa/clog"
	"github.com/abibby/salusa/database/databasedi"
	"github.com/abibby/salusa/di"
	"github.com/abibby/salusa/router"
	"github.com/abibby/salusa/salusaconfig"
	"github.com/abibby/salusa/salusadi"
	"github.com/abibby/salusa/view"
	"github.com/abibby/wishist/app/routes"
	"github.com/abibby/wishist/config"
	"github.com/abibby/wishist/db"
	"github.com/abibby/wishist/db/migrations"
)

//go:embed emails/*
var emails embed.FS

func main() {
	ctx := di.ContextWithDependencyProvider(
		context.Background(),
		di.NewDependencyProvider(),
	)

	err := config.Init()
	if err != nil {
		slog.Error("failed initialize config", "error", err)
		os.Exit(1)
	}

	err = view.Register(emails, "**/*.html")(ctx)
	if err != nil {
		slog.Error("failed register emails", "error", err)
		os.Exit(1)
	}

	di.RegisterSingleton(ctx, func() salusaconfig.Config {
		return config.Config
	})

	_ = salusadi.Register[*db.User](migrations.Use())(ctx)
	_ = databasedi.RegisterTransactions(db.DBMtx)(ctx)
	clog.Use(ctx)

	auth.SetAppKey(config.AppKey)

	err = mime.AddExtensionType(".webmanifest", "application/manifest+json")
	if err != nil {
		slog.Error("failed to add .webmanifest mimetype", "error", err)
		os.Exit(1)
	}

	r := router.New()

	r.Register(ctx)

	routes.InitRoutes(r)

	slog.Info("Listening on " + config.Config.GetBaseURL())

	s := &http.Server{
		Addr:    fmt.Sprintf(":%d", config.Config.GetHTTPPort()),
		Handler: r,
		BaseContext: func(l net.Listener) context.Context {
			return ctx
		},
	}

	err = s.ListenAndServe()
	if err != nil {
		slog.Error("http server failed", "error", err)
		os.Exit(1)
	}
}
