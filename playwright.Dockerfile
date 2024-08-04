FROM node:22 as ui-build

WORKDIR /wishist-ui

COPY ui/package.json ui/package-lock.json ./
RUN npm ci

# RUN ls && exit 1
COPY ./ui/ ./
RUN npm run build

FROM golang:1.22 as go-build

WORKDIR /go/src/github.com/abibby/wishist

COPY go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=ui-build /wishist-ui/dist ui/dist

RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -tags=test -o /wishist


# Start with a base Docker image that includes Playwright and a specific browser version.
FROM mcr.microsoft.com/playwright:v1.39.0-jammy

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and package-lock.json to the container.
COPY ui/package*.json ./

# Install project dependencies using 'npm ci' to ensure a consistent environment.
RUN npm ci

# Install Playwright browser binaries with all dependencies.
RUN npx playwright install --with-deps

# Copy the rest of your application code into the container.
COPY ./ui .

COPY --from=go-build /wishist /wishist

ENV WISHIST_EXECUTABLE=/wishist
ENV CI=true

# Define the default command to run when the container starts.
CMD ["npm", "test"]