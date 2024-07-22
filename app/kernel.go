package app

import (
	"context"
	"embed"
	"log/slog"
	"mime"
	"os"

	"github.com/abibby/salusa/auth"
	"github.com/abibby/salusa/kernel"
	"github.com/abibby/salusa/openapidoc"
	"github.com/abibby/salusa/salusadi"
	"github.com/abibby/salusa/view"
	"github.com/abibby/wishist/config"
	"github.com/abibby/wishist/db"
	"github.com/abibby/wishist/db/migrations"
	"github.com/go-openapi/spec"
)

//go:embed emails/*
var emails embed.FS

var Kernel = kernel.New(
	kernel.Config(config.Get),
	kernel.Bootstrap(
		config.Init,
		salusadi.Register[*db.User](migrations.Use()),
		view.Register(emails, "**/*.html"),
		func(ctx context.Context) error {
			auth.SetAppKey(config.AppKey)
			err := db.Open(ctx)
			if err != nil {
				slog.Error("failed to open database", "error", err)
				os.Exit(1)
			}

			err = mime.AddExtensionType(".webmanifest", "application/manifest+json")
			if err != nil {
				slog.Error("failed to add .webmanifest mimetype", "error", err)
				os.Exit(1)
			}

			return nil
		},
	),
	kernel.Services(),
	kernel.InitRoutes(InitRoutes),
	kernel.APIDocumentation(
		openapidoc.Info(spec.InfoProps{
			Title: "Wishist API",
		}),
		openapidoc.BasePath("/api"),
	),
)
