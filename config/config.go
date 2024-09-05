package config

import (
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"os"
	"strconv"
	"strings"

	"github.com/abibby/salusa/clog"
	"github.com/abibby/salusa/clog/loki"
	"github.com/abibby/salusa/database"
	"github.com/abibby/salusa/database/dialects/sqlite"
	"github.com/abibby/salusa/email"
	"github.com/abibby/salusa/salusaconfig"
	"github.com/joho/godotenv"
)

type Cfg interface {
	salusaconfig.Config
	email.MailConfiger
	database.DBConfiger
	clog.LoggerConfiger
}

type config struct{}

func env(key string, def string) string {
	v, ok := os.LookupEnv(key)
	if !ok {
		return def
	}
	return v
}
func mustEnv(key string) string {
	v, ok := os.LookupEnv(key)
	if !ok {
		panic(fmt.Sprintf("%s must be set in the environment", key))
	}
	return v
}

func envBool(key string, def bool) bool {
	strDef := "false"
	if def {
		strDef = "true"
	}
	str := strings.ToLower(env(key, strDef))
	return str != "false" && str != "0"
}
func envInt(key string, def int) int {
	value, err := strconv.Atoi(env(key, fmt.Sprint(def)))
	if err != nil {
		return def
	}
	return value
}

var (
	AppKey       []byte
	dbPath       string
	baseURL      string
	port         int
	verbose      bool
	loggerConfig clog.Config
)

var emailConfig email.Config

var Config Cfg = &config{}

func Init() error {
	err := godotenv.Load("./.env")
	if errors.Is(err, fs.ErrNotExist) {
	} else if err != nil {
		return err
	}
	AppKey = []byte(mustEnv("APP_KEY"))
	dbPath = env("DB_PATH", "./db.sqlite")
	port = envInt("PORT", 32148)
	baseURL = env("BASE_URL", fmt.Sprintf("http://localhost:%d", port))

	verbose = envBool("VERBOSE", false)

	emailConfig = &email.SMTPConfig{
		From:     env("MAIL_FROM", "wishist@example.com"),
		Host:     env("MAIL_HOST", "sandbox.smtp.mailtrap.io"),
		Port:     envInt("MAIL_PORT", 2525),
		Username: env("MAIL_USERNAME", "user"),
		Password: env("MAIL_PASSWORD", "pass"),
	}

	level := slog.LevelInfo
	if verbose {
		level = slog.LevelDebug
	}

	switch env("LOGGER", "") {
	case "loki":
		fmt.Println("using loki logging")
		loggerConfig = &loki.Config{
			Level:    level,
			URL:      env("LOKI_URL", ""),
			TenantID: env("LOKI_TENANT_ID", "wishist"),
		}
	default:
		loggerConfig = clog.NewDefaultConfig(level)

	}

	return nil
}

func (c *config) GetHTTPPort() int {
	return port
}
func (c *config) GetBaseURL() string {
	return baseURL
}
func (c *config) MailConfig() email.Config {
	return emailConfig
}
func (c *config) DBConfig() database.Config {
	return sqlite.NewConfig(dbPath)
}

func (c *config) LoggerConfig() clog.Config {
	return loggerConfig
}
