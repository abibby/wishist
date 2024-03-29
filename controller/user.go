package controller

import (
	"github.com/abibby/salusa/request"
	"github.com/abibby/wishist/db"
)

// type Purpose string

// const (
// 	PurposeAuthorize = Purpose("authorize")
// 	PurposeRefresh   = Purpose("refresh")
// )

// func WithPurpose(purpose Purpose) auth.TokenOptions {
// 	return auth.WithClaim("purpose", string(purpose))
// }

// func WithUser(u *db.User) auth.TokenOptions {
// 	return func(claims jwt.MapClaims) jwt.MapClaims {
// 		claims = auth.WithSubject(u.ID)(claims)
// 		claims = auth.WithClaim("username", u.Username)(claims)
// 		return claims
// 	}
// }

// func createUser(ctx context.Context, username string, passwordHash []byte, name string) (*db.User, error) {
// 	u := &db.User{}
// 	if username == "" {
// 		return nil, fmt.Errorf("username must not be empty")
// 	}
// 	err := db.Tx(ctx, func(tx *sqlx.Tx) error {
// 		_, err := tx.Exec(
// 			"INSERT INTO users (username,name,password) VALUES (?, ?, ?);",
// 			username,
// 			name,
// 			passwordHash,
// 		)
// 		if err != nil {
// 			return err
// 		}
// 		return tx.Get(u, "SELECT * FROM users ORDER BY id DESC LIMIT 1")
// 	})
// 	if err != nil {
// 		if err.Error() == "constraint failed: UNIQUE constraint failed: users.username (2067)" {
// 			return nil, fmt.Errorf("username is already taken")
// 		}
// 		return nil, err
// 	}
// 	return u, nil
// }

type GetUserRequest struct {
	User *db.User `inject:""`
}
type GetUserResponse db.User

var GetUser = request.Handler(func(r *GetUserRequest) (*GetUserResponse, error) {
	return (*GetUserResponse)(r.User), nil
})

// type CreateUserRequest struct {
// 	Username string `json:"username" validate:"required"`
// 	Name     string `json:"name"     validate:"required"`
// 	Password string `json:"password" validate:"required"`
// 	Request  *http.Request
// }
// type CreateUserResponse *db.User

// var CreateUser = request.Handler(func(r *CreateUserRequest) (any, error) {
// 	if r.Password == "" {
// 		return nil, fmt.Errorf("password must not be empty")
// 	}
// 	hash, err := bcrypt.GenerateFromPassword([]byte(r.Password), bcrypt.MinCost)
// 	if err != nil {
// 		return nil, err
// 	}

// 	u, err := createUser(r.Request.Context(), r.Username, hash, r.Name)
// 	return CreateUserResponse(u), err
// })

// type CreateUserPasswordlessRequest struct {
// 	Username string `json:"username" validate:"required"`
// 	Name     string `json:"name"     validate:"required"`
// 	Request  *http.Request
// }
// type CreateUserPasswordlessResponse struct {
// 	User    *db.User `json:"user"`
// 	Token   string   `json:"token"`
// 	Refresh string   `json:"refresh"`
// }

// var CreateUserPasswordless = request.Handler(func(r *CreateUserPasswordlessRequest) (any, error) {
// 	u, err := createUser(r.Request.Context(), r.Username, []byte{}, r.Name)
// 	if err != nil {
// 		return nil, err
// 	}

// 	token, refresh, err := generateTokens(u)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &CreateUserPasswordlessResponse{
// 		User:    u,
// 		Token:   token,
// 		Refresh: refresh,
// 	}, nil
// })

// type LoginRequest struct {
// 	Username string `json:"username" validate:"required"`
// 	Password string `json:"password" validate:"required"`
// 	Request  *http.Request
// }
// type LoginResponse struct {
// 	Token   string `json:"token"`
// 	Refresh string `json:"refresh"`
// }

// var Login = request.Handler(func(r *LoginRequest) (any, error) {
// 	u := &db.User{}

// 	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
// 		return tx.Get(u, "select * from users where username=?", r.Username)
// 	})
// 	if errors.Is(err, sql.ErrNoRows) {
// 		return nil, request.NewHTTPError(fmt.Errorf("unauthorized"), http.StatusUnauthorized)
// 	} else if err != nil {
// 		return nil, err
// 	}

// 	err = bcrypt.CompareHashAndPassword(u.Password, []byte(r.Password))
// 	if err != nil {
// 		return nil, err
// 	}

// 	token, refresh, err := generateTokens(u)
// 	if err != nil {
// 		return nil, err
// 	}
// 	return &LoginResponse{
// 		Token:   token,
// 		Refresh: refresh,
// 	}, nil
// })

// type RefreshRequest struct {
// 	Request *http.Request
// }

// var Refresh = request.Handler(func(r *RefreshRequest) (any, error) {

// 	u := &db.User{}
// 	uid, ok := userID(r.Request.Context())
// 	if !ok {
// 		return nil, fmt.Errorf("user not logged in")
// 	}
// 	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
// 		return tx.Get(u, "select * from users where id=?", uid)
// 	})
// 	if errors.Is(err, sql.ErrNoRows) {
// 		return nil, request.NewHTTPError(fmt.Errorf("unauthorized"), http.StatusUnauthorized)
// 	} else if err != nil {
// 		return nil, err
// 	}

// 	token, refresh, err := generateTokens(u)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &LoginResponse{
// 		Token:   token,
// 		Refresh: refresh,
// 	}, nil
// })

// func generateTokens(u *db.User) (string, string, error) {
// 	passwordless := len(u.Password) == 0

// 	token, err := auth.GenerateToken(
// 		WithUser(u),
// 		auth.WithLifetime(24*time.Hour),
// 		auth.WithClaim("passwordless", passwordless),
// 		WithPurpose(PurposeAuthorize),
// 	)
// 	if err != nil {
// 		return "", "", err
// 	}

// 	refresh, err := auth.GenerateToken(
// 		WithUser(u),
// 		claimsIf(!passwordless, auth.WithLifetime(30*24*time.Hour)),
// 		auth.WithClaim("passwordless", passwordless),
// 		WithPurpose(PurposeRefresh),
// 	)
// 	if err != nil {
// 		return "", "", err
// 	}
// 	return token, refresh, nil
// }
// func claimsIf(condition bool, modifyClaims ...auth.TokenOptions) auth.TokenOptions {
// 	return func(claims jwt.MapClaims) jwt.MapClaims {
// 		if condition {
// 			for _, m := range modifyClaims {
// 				claims = m(claims)
// 			}
// 		}
// 		return claims
// 	}
// }
