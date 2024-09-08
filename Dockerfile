FROM node:22 as ui-build

WORKDIR /wishist-ui

COPY ui/package.json ui/package-lock.json ./
RUN npm ci

# RUN ls && exit 1
COPY ./ui/ ./
RUN npm run build

# Now copy it into our base image.
FROM alpine:latest AS certs
RUN apk add --no-cache ca-certificates && \
    update-ca-certificates


FROM golang:1-alpine AS go-build
RUN apk add --no-cache build-base
WORKDIR /build
COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
COPY --from=ui-build /wishist-ui/dist ui/dist

RUN GOOS=linux GOARCH=amd64 go build -ldflags='-s -w' -trimpath -o /dist/wishist
RUN ldd /dist/wishist | tr -s [:blank:] '\n' | grep ^/ | xargs -I % install -D % /dist/%
RUN ln -s ld-musl-x86_64.so.1 /dist/lib/libc.musl-x86_64.so.1


FROM scratch
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=go-build /dist /
ENTRYPOINT ["/wishist"]