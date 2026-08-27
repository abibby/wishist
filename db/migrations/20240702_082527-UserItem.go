package migrations

import (
	"abibby.com/salusa/database/migrate"
	"abibby.com/salusa/database/schema"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20240702_082527-UserItem",
		Up: schema.Create("user_items", func(table *schema.Blueprint) {
			table.Int("user_id")
			table.Int("item_id")
			table.String("type")
			table.PrimaryKey("user_id", "item_id")
		}),
		Down: schema.DropIfExists("user_items"),
	})
}
