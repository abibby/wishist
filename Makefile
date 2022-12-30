GC=go

all:
	mkdir -p bin
	$(GC) build -o bin/wishlist

dev:
	$(GC) run -tags dev main.go