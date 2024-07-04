package migrations

import (
	"github.com/abibby/salusa/database/migrate"
	"github.com/abibby/salusa/database/schema"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20240702_082529-Friend",
		Up: schema.Create("friends", func(table *schema.Blueprint) {
			table.Int("user_id")
			table.Int("friend_id")
			table.PrimaryKey("user_id", "friend_id")
		}),
		Down: schema.DropIfExists("friends"),
	})
}
