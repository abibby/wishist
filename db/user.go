package db

import (
	"fmt"

	"github.com/abibby/salusa/auth"
	"github.com/abibby/salusa/database/model"
)

type User struct {
	model.BaseModel
	ID       int    `db:"id,autoincrement,primary" json:"id"`
	Name     string `db:"name"                     json:"name"`
	Username string `db:"username"                 json:"username"`
	Email    string `db:"email"                    json:"email"`
	Password []byte `db:"password"                 json:"-"`
	Lookup   string `db:"lookup"                   json:"-"`
	Verified bool   `db:"verified"                 json:"-"`
}

var _ auth.User = (*User)(nil)
var _ auth.EmailVerified = (*User)(nil)

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
