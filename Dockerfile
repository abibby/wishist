FROM node:25 AS ui-build

WORKDIR /wishist-ui

COPY ui/package.json ui/package-lock.json ./
RUN npm ci

COPY ./ui/ ./
RUN npm run build


FROM golang:1.26-trixie AS go-build
WORKDIR /build
COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
COPY --from=ui-build /wishist-ui/dist ui/dist

RUN GOOS=linux GOARCH=amd64 go build -o /dist/wishist
# RUN ldd /dist/wishist | tr -s [:blank:] '\n' | grep ^/ | xargs -I % install -D % /dist/%
# RUN ln -s ld-musl-x86_64.so.1 /dist/lib/libc.musl-x86_64.so.1


FROM docker.io/chromedp/headless-shell:latest
COPY --from=go-build /dist/wishist /wishist
ENTRYPOINT ["/wishist"]