package retail

import (
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/davecgh/go-spew/spew"
	"golang.org/x/net/html"
)

type extractor func(path []html.Token, t html.Token)

func htmlExtractor(r io.Reader, extractors ...extractor) error {

	tokenizer := html.NewTokenizer(r)

	// inBody := false
	// tag := ""

	path := []html.Token{}

	for {
		tt := tokenizer.Next()
		if tt == html.ErrorToken {
			if errors.Is(tokenizer.Err(), io.EOF) {
				return nil
			}
			return fmt.Errorf("extractorFromHTML: %w", tokenizer.Err())
		}
		t := tokenizer.Token()
		switch tt {
		case html.StartTagToken:
			path = append(path, t)

		case html.EndTagToken:
			path = path[:len(path)-1]
		}

		for _, ext := range extractors {
			ext(path, t)
		}
	}
}

func openGraphProperty(property string, target *string) extractor {
	return func(path []html.Token, t html.Token) {
		if t.Type != html.StartTagToken {
			return
		}
		if len(path) < 1 || path[len(path)-1].Data != "meta" {
			return
		}

		found := false
		content := ""
		for _, attr := range t.Attr {
			if attr.Key == "property" && attr.Val == property {
				found = true
			}

			if attr.Key == "content" {
				content = attr.Val
			}
		}
		if !found {
			return
		}

		*target = content
	}
}

func propertyByElementID(id, attrName string, target *string) extractor {
	return func(path []html.Token, t html.Token) {
		if t.Type != html.StartTagToken {
			return
		}
		found := false
		value := ""
		for _, attr := range t.Attr {
			if attr.Key == "id" && attr.Val == id {
				found = true
			}

			if attr.Key == attrName {
				value = attr.Val
			}
		}
		if !found {
			return
		}
		*target = value
	}

}

func textByElementID(id string, target *string) extractor {
	return func(path []html.Token, t html.Token) {
		if t.Type != html.TextToken {
			return
		}

		if len(path) < 1 {
			return
		}
		parent := path[len(path)-1]
		for _, attr := range parent.Attr {
			if attr.Key == "id" && attr.Val == id {
				spew.Dump(parent, t)
				*target = strings.TrimSpace(t.Data)
			}
		}
	}
}
