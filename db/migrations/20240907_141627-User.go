package migrations

import (
	"time"

	"github.com/abibby/salusa/database/migrate"
	"github.com/abibby/salusa/database/schema"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20240907_141627-User",
		Up: schema.Table("users", func(table *schema.Blueprint) {
			table.DateTime("created_at").Default(time.Now())
			table.DateTime("updated_at").Default(time.Now())
			table.DateTime("deleted_at").Nullable()
		}),
		Down: schema.Table("users", func(table *schema.Blueprint) {
			table.DropColumn("created_at")
			table.DropColumn("updated_at")
			table.DropColumn("deleted_at")
		}),
	})
}
