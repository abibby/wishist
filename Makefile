GC=go

USERNAME ?= $(shell bash -c 'read -p "Username: " username; echo $$username')

all: npm
	mkdir -p bin
	$(GC) build -o bin/wishlist

npm:
	cd ui; npm run build

dev:
	$(GC) run -tags dev main.go

migration:
	@echo 'Enter the name of the migration'
	@read NAME; \
	touch ./db/migrations/`date +'%Y%m%d%H%M%S'`_$$NAME.up.sql; \
	touch ./db/migrations/`date +'%Y%m%d%H%M%S'`_$$NAME.down.sql;