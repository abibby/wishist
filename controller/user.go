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
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

type CreateUserRequest struct {
	Username string `json:"username"`
	Name     string `json:"name"`
	Password []byte `json:"password"`
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
	Username string `json:"username"`
	Password []byte `json:"password"`
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
		u,
		auth.WithLifetime(24*time.Hour),
		auth.WithPurpose(auth.PurposeLogin),
	)
	if err != nil {
		return nil, err
	}
	refresh, err := auth.GenerateToken(
		u,
		auth.WithLifetime(30*24*time.Hour),
		auth.WithPurpose(auth.PurposeRefresh),
	)
	return &LoginResponse{
		Token:   token,
		Refresh: refresh,
	}, nil
})
