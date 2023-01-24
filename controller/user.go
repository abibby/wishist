package controller

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/abibby/validate/handler"
	"github.com/abibby/wishlist/auth"
	"github.com/abibby/wishlist/db"
	"github.com/golang-jwt/jwt/v4"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

type Purpose string

const (
	PurposeAuthorize = Purpose("authorize")
	PurposeRefresh   = Purpose("refresh")
)

func WithPurpose(purpose Purpose) auth.TokenOptions {
	return auth.WithClaim("purpose", string(purpose))
}

func WithUser(u *db.User) auth.TokenOptions {
	return func(claims jwt.MapClaims) jwt.MapClaims {
		claims = auth.WithSubject(u.ID)(claims)
		claims = auth.WithClaim("username", u.Username)(claims)
		return claims
	}
}

type CreateUserRequest struct {
	Username string `json:"username" validate:"required"`
	Name     string `json:"name"     validate:"required"`
	Password []byte `json:"password" validate:"required"`
	Request  *http.Request
}
type CreateUserResponse *db.User

var CreateUser = handler.Handler(func(r *CreateUserRequest) (any, error) {
	hash, err := bcrypt.GenerateFromPassword(r.Password, bcrypt.MinCost)
	if err != nil {
		return nil, err
	}

	err = db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec(
			"INSERT INTO users (username,name,password) VALUES (?, ?, ?);",
			r.Username,
			r.Name,
			hash,
		)
		return err
	})
	if err != nil {
		return nil, err
	}
	return CreateUserResponse(&db.User{
		Name:     r.Name,
		Username: r.Username,
	}), nil
})

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password []byte `json:"password" validate:"required"`
	Request  *http.Request
}
type LoginResponse struct {
	Token   string `json:"token"`
	Refresh string `json:"refresh"`
}

var Login = handler.Handler(func(r *LoginRequest) (any, error) {
	u := &db.User{}

	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		return tx.Get(u, "select * from users where username=?", r.Username)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return handler.ErrorResponse(fmt.Errorf("unauthorized"), http.StatusUnauthorized), nil
	} else if err != nil {
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword(u.Password, r.Password)
	if err != nil {
		return nil, err
	}

	token, err := auth.GenerateToken(
		WithUser(u),
		auth.WithLifetime(24*time.Hour),
		WithPurpose(PurposeAuthorize),
	)
	if err != nil {
		return nil, err
	}
	refresh, err := auth.GenerateToken(
		WithUser(u),
		auth.WithLifetime(30*24*time.Hour),
		WithPurpose(PurposeRefresh),
	)
	return &LoginResponse{
		Token:   token,
		Refresh: refresh,
	}, nil
})

type RefreshRequest struct {
	Request *http.Request
}

var Refresh = handler.Handler(func(r *RefreshRequest) (any, error) {
	u := &db.User{}
	uid := userID(r.Request.Context())
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		return tx.Get(u, "select * from users where id=?", uid)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return handler.ErrorResponse(fmt.Errorf("unauthorized"), http.StatusUnauthorized), nil
	} else if err != nil {
		return nil, err
	}

	token, err := auth.GenerateToken(
		WithUser(u),
		auth.WithLifetime(24*time.Hour),
		WithPurpose(PurposeAuthorize),
	)
	if err != nil {
		return nil, err
	}
	refresh, err := auth.GenerateToken(
		WithUser(u),
		auth.WithLifetime(30*24*time.Hour),
		WithPurpose(PurposeRefresh),
	)
	return &LoginResponse{
		Token:   token,
		Refresh: refresh,
	}, nil
})
