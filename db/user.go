package db

import (
	"context"
	"fmt"

	"github.com/abibby/salusa/auth"
	"github.com/abibby/salusa/database"
	"github.com/abibby/salusa/database/builder"
	"github.com/abibby/salusa/database/hooks"
	"github.com/abibby/salusa/database/model"
	"github.com/abibby/salusa/database/model/mixins"
	"github.com/abibby/wishist/services/gravatar"
)

//go:generate spice generate:migration
type User struct {
	model.BaseModel
	mixins.Timestamps
	mixins.SoftDelete
	ID        int    `db:"id,autoincrement,primary" json:"id"`
	Name      string `db:"name"                     json:"name"`
	Username  string `db:"username,unique"          json:"username"`
	Email     string `db:"email"                    json:"-"`
	Password  []byte `db:"password"                 json:"-"`
	Lookup    string `db:"lookup"                   json:"-"`
	Verified  bool   `db:"verified"                 json:"-"`
	AvatarURL string `db:"-"                        json:"avatar_url"`
}

func UserQuery(ctx context.Context) *builder.ModelBuilder[*User] {
	return builder.From[*User]().WithContext(ctx)
}

var _ auth.User = (*User)(nil)
var _ auth.EmailVerified = (*User)(nil)
var _ hooks.AfterLoader = (*User)(nil)

func (u *User) GetID() string {
	return fmt.Sprint(u.ID)
}
func (u *User) SetUsername(user string) {
	u.Email = user
}
func (u *User) GetPasswordHash() []byte {
	return u.Password
}
func (u *User) SetPasswordHash(pass []byte) {
	u.Password = pass
}
func (u *User) SaltedPassword(password string) []byte {
	return []byte(fmt.Sprintf("%d%s", u.ID, password))
}
func (u *User) UsernameColumns() []string {
	return []string{"email", "username"}
}
func (u *User) GetEmail() string {
	return u.Email
}
func (u *User) SetLookupToken(l string) {
	u.Lookup = l
}
func (u *User) IsVerified() bool {
	return u.Verified
}
func (u *User) SetVerified(v bool) {
	u.Verified = v

}
func (u *User) LookupTokenColumn() string {
	return "lookup"
}

func (u *User) AfterLoad(ctx context.Context, tx database.DB) error {
	u.AvatarURL = gravatar.NewGravatarFromEmail(u.Email).GetURL()
	return nil
}
