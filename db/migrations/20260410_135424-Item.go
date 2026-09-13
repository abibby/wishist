package migrations

import (
	"gosalusa.com/database/migrate"
	"gosalusa.com/database/schema"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20260410_135424-Item",
		Up: schema.Table("items", func(table *schema.Blueprint) {
			table.Int("price").Nullable()
		}),
		Down: schema.Table("items", func(table *schema.Blueprint) {
			table.DropColumn("price")
		}),
	})
}
