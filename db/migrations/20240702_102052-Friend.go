package migrations

import (
	"github.com/abibby/salusa/database/migrate"
	"github.com/abibby/salusa/database/schema"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20240702_102052-Friend",
		Up: schema.Table("friends", func(table *schema.Blueprint) {
			table.DropColumn("friend_name")
			table.DropColumn("friend_username")
		}),
		Down: schema.Table("friends", func(table *schema.Blueprint) {
			table.String("friend_name")
			table.String("friend_username")
		}),
	})
}
