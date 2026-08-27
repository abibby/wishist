package migrations

import (
	"abibby.com/salusa/database/migrate"
	"abibby.com/salusa/database/schema"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20260413_125840-Item",
		Up: schema.Table("items", func(table *schema.Blueprint) {
			table.Int("order").Default(0)
		}),
		Down: schema.Table("items", func(table *schema.Blueprint) {
			table.DropColumn("order")
		}),
	})
}
