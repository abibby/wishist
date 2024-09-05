GC=go

USERNAME ?= $(shell bash -c 'read -p "Username: " username; echo $$username')

all: npm
	mkdir -p bin
	$(GC) build -o bin/wishlist

run-test: npm
	# DB_PATH="test-`date`.sqlite" $(GC) run -tags test .
	DB_PATH=":memory:" $(GC) run -tags test .

run-dev-test:
	DB_PATH="test-`date`.sqlite" $(GC) run -tags test -tags dev .

npm:
	cd ui; npm run build

dev:
	$(GC) run -tags dev .
