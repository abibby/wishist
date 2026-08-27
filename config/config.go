package config

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"strconv"
	"strings"

	"abibby.com/salusa/database"
	"abibby.com/salusa/database/dialects/sqlite"
	"abibby.com/salusa/email"
	"github.com/joho/godotenv"
)

type Cfg struct{}

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

var AppKey []byte
var DBPath string
var BaseURL string
var Port int
var Verbose bool
var BricksetAPIKey string
var RemoteAddressHeader string
var TrustedIP string

var Email email.Config

var Config = &Cfg{}

func Init() error {
	err := godotenv.Load("./.env")
	if errors.Is(err, fs.ErrNotExist) {
	} else if err != nil {
		return err
	}
	AppKey = []byte(mustEnv("APP_KEY"))
	DBPath = env("DB_PATH", "./db.sqlite")
	Port = envInt("PORT", 32148)
	BaseURL = env("BASE_URL", fmt.Sprintf("http://localhost:%d", Port))

	Verbose = envBool("VERBOSE", false)

	BricksetAPIKey = env("BRICKSET_API_KEY", "")
	RemoteAddressHeader = env("REMOTE_ADDRESS_HEADER", "")
	TrustedIP = env("TRUSTED_IP", "")

	Email = &email.SMTPConfig{
		From:     env("MAIL_FROM", "wishist@example.com"),
		Host:     env("MAIL_HOST", "sandbox.smtp.mailtrap.io"),
		Port:     envInt("MAIL_PORT", 2525),
		Username: env("MAIL_USERNAME", "user"),
		Password: env("MAIL_PASSWORD", "pass"),
	}

	return nil
}

func (c *Cfg) GetHTTPPort() int {
	return Port
}
func (c *Cfg) GetBaseURL() string {
	return BaseURL
}
func (c *Cfg) MailConfig() email.Config {
	return Email
}
func (c *Cfg) DBConfig() database.Config {
	return sqlite.NewConfig(DBPath)
}
