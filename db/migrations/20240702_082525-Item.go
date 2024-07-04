package migrations

import (
	"github.com/abibby/salusa/database/migrate"
	"github.com/abibby/salusa/database/schema"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20240702_082525-Item",
		Up: schema.Create("items", func(table *schema.Blueprint) {
			table.Int("id").Primary().AutoIncrement()
			table.Int("user_id")
			table.String("name")
			table.String("description")
			table.String("url")
		}),
		Down: schema.DropIfExists("items"),
	})
}
