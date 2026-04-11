package migrations

import (
	"github.com/abibby/salusa/database/migrate"
	"github.com/abibby/salusa/database/schema"
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
