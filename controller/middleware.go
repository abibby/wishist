package controller

import (
	"bytes"
	"io"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"
)

type ResponseWriter struct {
	rw     http.ResponseWriter
	Body   *bytes.Buffer
	Status int
}

func NewResponseWriter(rw http.ResponseWriter) *ResponseWriter {
	return &ResponseWriter{
		rw:   rw,
		Body: &bytes.Buffer{},
	}
}
func (w *ResponseWriter) Header() http.Header {
	return w.rw.Header()
}
func (w *ResponseWriter) Write(b []byte) (int, error) {
	w.Body.Write(b)
	return w.rw.Write(b)
}
func (w *ResponseWriter) WriteHeader(statusCode int) {
	w.Status = statusCode
	w.rw.WriteHeader(statusCode)
}

func (w *ResponseWriter) OK() bool {
	return w.Status >= 200 && w.Status < 400
}

func ErrorMiddleware() mux.MiddlewareFunc {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			rw := NewResponseWriter(w)

			body, err := io.ReadAll(r.Body)
			if err != nil {
				slog.Warn("faild to copy body")
			}

			r.Body = io.NopCloser(bytes.NewBuffer(body))

			h.ServeHTTP(rw, r)

			if !rw.OK() {
				slog.Error("non 200 response",
					"status", rw.Status,
					"response", rw.Body.String(),
					"body", string(body),
				)
			}
		})
	}
}
