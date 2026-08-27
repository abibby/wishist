package migrations

import (
	"abibby.com/salusa/database/migrate"
	"abibby.com/salusa/database/schema"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20240702_082530-User",
		Up: schema.Create("users", func(table *schema.Blueprint) {
			table.Int("id").Primary().AutoIncrement()
			table.String("name")
			table.String("username").Unique()
			table.String("email")
			table.Blob("password")
			table.String("lookup")
			table.Bool("verified")
		}),
		Down: schema.DropIfExists("users"),
	})
}
