package retail

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	htmltomarkdown "github.com/JohannesKaufmann/html-to-markdown/v2"
)

type Lego struct {
	httpClient *http.Client
}

var _ Retail = (*Lego)(nil)

func NewLego() *Lego {
	return &Lego{
		httpClient: http.DefaultClient,
	}
}

// Name implements [Retail].
func (l *Lego) Name() string {
	return "lego"
}

// Check implements [Retail].
func (o *Lego) Check(uri string) bool {
	u, err := url.Parse(uri)
	if err != nil {
		return false
	}

	return strings.HasSuffix(u.Host, "lego.com") && strings.HasPrefix(u.Path, "/en-ca/product/")
}

// Details implements [Retail].
func (o *Lego) Details(uri string) (*Product, error) {
	parts := strings.Split(uri, "-")
	setNumber := parts[len(parts)-1]
	params, err := json.Marshal(map[string]any{
		"setNumber":    setNumber + "-1",
		"extendedData": 1,
	})
	if err != nil {
		return nil, err
	}

	requestBody := url.Values{}
	requestBody.Add("apiKey", os.Getenv("BRICKSET_API_KEY"))
	requestBody.Add("params", string(params))
	requestBody.Add("userHash", "")

	req, err := http.NewRequest("POST", "https://brickset.com/api/v3.asmx/getSets", strings.NewReader(requestBody.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Add("Host", "brickset.com")
	req.Header.Add("User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0")
	req.Header.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Add("Accept-Language", "en-US,en;q=0.5")
	req.Header.Add("Referer", "https://brickset.com/api/v3.asmx?op=getSets")
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("Content-Length", "80")
	req.Header.Add("Origin", "https://brickset.com")
	req.Header.Add("Connection", "keep-alive")
	req.Header.Add("Upgrade-Insecure-Requests", "1")
	req.Header.Add("Sec-Fetch-Dest", "document")
	req.Header.Add("Sec-Fetch-Mode", "navigate")
	req.Header.Add("Sec-Fetch-Site", "same-origin")
	req.Header.Add("Priority", "u=0, i")

	resp, err := o.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("invalid status code %s", resp.Status)
	}

	br := &BricksetResponse{}

	err = json.NewDecoder(resp.Body).Decode(br)
	if err != nil {
		return nil, fmt.Errorf("json decode: %w", err)
	}

	if len(br.Sets) != 1 {
		return nil, fmt.Errorf("incorrect number of sets")
	}

	set := br.Sets[0]

	markdown, err := htmltomarkdown.ConvertString(set.ExtendedData.Description)
	if err != nil {
		return nil, fmt.Errorf("parse description markdown: %w", err)
	}

	return &Product{
		Title:       set.Name,
		Description: markdown,
		Image:       set.Image.ImageURL,
		URL:         uri,
		Price:       int(math.Round(set.LEGOCom.CA.RetailPrice * 100)),
		Currency:    "CAD",
	}, nil
}

type BricksetResponse struct {
	Status  string `json:"status"`
	Matches int    `json:"matches"`
	Sets    []Set  `json:"sets"`
}

type Set struct {
	SetID                int             `json:"setID"`
	Number               string          `json:"number"`
	NumberVariant        int             `json:"numberVariant"`
	Name                 string          `json:"name"`
	Year                 int             `json:"year"`
	Theme                string          `json:"theme"`
	ThemeGroup           string          `json:"themeGroup"`
	Subtheme             string          `json:"subtheme"`
	Category             string          `json:"category"`
	Released             bool            `json:"released"`
	Pieces               int             `json:"pieces"`
	LaunchDate           time.Time       `json:"launchDate"`
	ExitDate             time.Time       `json:"exitDate"`
	Image                Image           `json:"image"`
	BricksetURL          string          `json:"bricksetURL"`
	Collection           Collection      `json:"collection"`
	Collections          Collections     `json:"collections"`
	LEGOCom              LEGOCom         `json:"LEGOCom"`
	Rating               float64         `json:"rating"`
	ReviewCount          int             `json:"reviewCount"`
	PackagingType        string          `json:"packagingType"`
	Availability         string          `json:"availability"`
	InstructionsCount    int             `json:"instructionsCount"`
	AdditionalImageCount int             `json:"additionalImageCount"`
	AgeRange             interface{}     `json:"ageRange"` // Empty in source, interface{} allows for flexibility
	Dimensions           interface{}     `json:"dimensions"`
	ModelDimensions      ModelDimensions `json:"modelDimensions"`
	Barcode              Barcode         `json:"barcode"`
	ItemNumber           ItemNumber      `json:"itemNumber"`
	ExtendedData         ExtendedData    `json:"extendedData"`
	LastUpdated          time.Time       `json:"lastUpdated"`
}

type Image struct {
	ThumbnailURL string `json:"thumbnailURL"`
	ImageURL     string `json:"imageURL"`
}

type Collection struct {
	SetID          int `json:"setID"`
	QtyOwned       int `json:"qtyOwned"`
	QtyWanted      int `json:"qtyWanted"`
	QtyOwnedNew    int `json:"qtyOwnedNew"`
	QtyOwnedUsed   int `json:"qtyOwnedUsed"`
	WantedPriority int `json:"wantedPriority"`
}

type Collections struct {
	OwnedBy  int `json:"ownedBy"`
	WantedBy int `json:"wantedBy"`
}

// RegionData represents the pricing and availability for a specific territory
type RegionData struct {
	RetailPrice        float64   `json:"retailPrice"`
	DateFirstAvailable time.Time `json:"dateFirstAvailable"`
}

type LEGOCom struct {
	US RegionData `json:"US"`
	UK RegionData `json:"UK"`
	CA RegionData `json:"CA"`
	DE RegionData `json:"DE"`
}

type ModelDimensions struct {
	Dimension1 float64 `json:"dimension1"`
	Dimension2 float64 `json:"dimension2"`
	Dimension3 float64 `json:"dimension3"`
}

type Barcode struct {
	EAN string `json:"EAN"`
	UPC string `json:"UPC"`
}

type ItemNumber struct {
	NA string `json:"NA"`
	EU string `json:"EU"`
}

type ExtendedData struct {
	Tags        []string `json:"tags"`
	Description string   `json:"description"`
}
