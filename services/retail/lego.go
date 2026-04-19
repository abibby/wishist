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

// Check implements [Retail].
func (o *Lego) Check(uri string) bool {
	u, err := url.Parse(uri)
	if err != nil {
		return false
	}

	return strings.HasSuffix(u.Host, "lego.com")
}

// Details implements [Retail].
func (o *Lego) Details(uri string) (*Product, error) {
	params, err := json.Marshal(map[string]any{
		"setNumber":    "72153-1",
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

	// POST /api/v3.asmx/getSets HTTP/2
	req.Header.Add("Host", "brickset.com")
	req.Header.Add("User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0")
	req.Header.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Add("Accept-Language", "en-US,en;q=0.5")
	// req.Header.Add("Accept-Encoding", "gzip, deflate, br, zstd")
	req.Header.Add("Referer", "https://brickset.com/api/v3.asmx?op=getSets")
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("Content-Length", "80")
	req.Header.Add("Origin", "https://brickset.com")
	req.Header.Add("Connection", "keep-alive")
	// req.Header.Add("Cookie", "ASP.NET_SessionId=3e3ec3yjvwwfpvx4h5a0nlki; ActualCountry=CountryCode=CA&CountryName=Canada; PreferredCountry2=CountryCode=CA&CountryName=Canada; cf_clearance=veUyGO6OmoY9XBnoFxyIW07H37KWONWtK0Nr7OV_684-1776540221-1.2.1.1-bIhQocOVdSeH1SN8fwKg1JL9c3AzbcGLL93sCssg4ZXsnGrKgF5jKZ2i_0ASgveRxPWpcPa3Cbmo.TggQJq46Um13LM7xuRt3pYFOTLGObCRxYHHIY1GLfhzRpEEPtbVmOYg6S.62orde1dwFD5JYSraoToK0ilNt_YkD.S1cKtB9tj_.1W7DCHAmS.ZZaAJhx5AIUDKzI.D8LVGlzsZTZAxkeL7_MCTxmnuFCSrOBHffGuj65amdMOX_dQfW4jlD.FeR14XyP0wQzlJk5zp95GlQ_IXaOUuJn57YHgMge2Be_EaY3monUvUr3eumBGD84eXXAZOpk4hpPM_rXUz_g; usprivacy=1---; ad_clicker=false; _sharedid=fe31d3dc-5b74-4c8f-b60e-27961d3aa6b7; _sharedid_cst=Q54OaA%3D%3D; _li_dcdm_c=.brickset.com; _lc2_fpi=93114e3db128--01kph0s6t37gec1s4axk25qnz1; _lc2_fpi_meta=%7B%22w%22%3A1776540228419%7D; _lr_retry_request=true; _lr_env_src_ats=false; pw_uuid=user_c40074f8-9586-4780-8c0a-949a507a59d9_1776540228445; cto_bundle=bfXtYF9INXhLWmVWUXJvaUtTTDN1RmtQY29KVTFDem9wWGdSWmtzZ01zJTJCekNObEU1THppU2lvQUNmNVRrVXNTWGxkOVVpaHBzTlpVMHRyaXklMkJvcnlzYlVQREgwNU5EQUwlMkZuSXNmRlhSVTJ3a3U0emNUJTJGTyUyQjN5NUVaNERzb3htUXFRcUxYN2hSaUM2djlCejJMYkxYUHRGN0VnJTNEJTNE; cto_bidid=1RBPgV81cCUyRkVQbEJkQnRXJTJCcFdhQ3luUllTSDZMc3JpZ0t1RGs1c2RpYSUyQklsalNUTUR4SXFSb2JLMDRZcEtaNDBPNzd2MUJnSHlLdGJCam0yRUJSbjNCT0RWUURMJTJCa1FoN2g1dGslMkIzN0x4akp3VjQlM0Q; panoramaId_expiry=1777145020722; _cc_id=2d5590b32cb5a58efb3ed65dc496823d; panoramaId=3a8eac78abb29e5f6113b23c77c0185ca02ce2831e1e35db8cc59ec414dbe757; _lr_geo_location=CA; _ga_ZSNG05RX84=GS2.1.s1776540229$o1$g1$t1776540405$j60$l0$h0; _ga=GA1.1.550106333.1776540229; _ga_EFZWYSQ4VF=GS2.1.s1776540229$o1$g1$t1776540405$j9$l0$h0; usprivacy=1---; _awl=2.1776540376.5-6137b6bcb838fa942c78776fc1a967e0-6763652d75732d63656e7472616c31-0; euconsent-v2=CQi298AQi298AAKA9AENCbFgAAAAAEPgAAwIAAAYsABMNDogjLIgUCBQEIIEACgrCACgQBAAAkDRAQAmDAhyBgAusJkAIAUAAwQAgABBgACAAASABCIAIACAQAgQCBQABgAQBAQAMDAAGACxEAgABAdAxTAggECwASIyqDTAhAASCAlsqEEoGBBXCFIscAggREwUAAAIABQAAID4WAhJKCViQQBcQXQAIAAAAUQIsCKQswBBUGaLQVgScBkaYBk-YJklOgiAJghIyDIhNUEg8UxRCghyA2KWYA6eIKAGXayQh_qBYAAA.IMXNR_G__bXlv-bb36btkeYxf9_hr7sQxBgbJs24FzLvW7JwH32E7NEzatqYKmRIAu3TBIQNtHJjURUChKIgVrzDsaE2U4TtKJ-BkiHMZY2tYCFxvm4tjWQCZ4ur_91d9mR-t7dr-2dzy27hnv3a9fuS1UJidKYetHfv8ZBOT-_IU9_x-_4v4_MbpEm8eS1v_tWtt43d64vP_dpuxt-Tyff7____73_e7X__e__33_-qXX_r7____________f__________9__A.YAAAAAAAAAAA; addtl_consent=2~~dv.20.43.46.55.57.61.70.83.89.93.108.117.122.124.135.143.144.147.149.159.161.184.192.196.211.228.230.236.239.255.259.266.272.286.291.311.313.314.320.322.323.327.358.367.370.371.385.407.415.424.429.430.436.445.469.486.491.494.495.522.523.540.550.560.568.574.576.584.587.591.621.723.737.797.798.802.803.820.827.839.864.899.904.922.931.938.955.959.979.981.985.986.1003.1027.1031.1033.1040.1046.1047.1048.1051.1053.1067.1092.1095.1097.1099.1107.1109.1126.1135.1143.1149.1152.1162.1166.1186.1188.1192.1205.1215.1220.1226.1227.1230.1252.1268.1270.1276.1284.1290.1301.1307.1312.1329.1342.1345.1356.1365.1375.1403.1415.1416.1419.1421.1423.1440.1449.1455.1495.1512.1514.1516.1525.1540.1548.1555.1558.1570.1577.1579.1583.1584.1598.1603.1616.1638.1651.1653.1659.1660.1667.1677.1678.1682.1697.1699.1703.1712.1716.1720.1721.1725.1732.1735.1745.1750.1753.1765.1782.1786.1800.1808.1810.1825.1827.1832.1838.1840.1843.1845.1859.1870.1878.1880.1882.1889.1898.1911.1917.1928.1929.1942.1944.1958.1962.1963.1964.1967.1968.1969.1978.1985.1987.2003.2008.2027.2035.2038.2039.2044.2047.2052.2056.2064.2068.2069.2072.2074.2084.2088.2090.2103.2107.2109.2115.2124.2130.2133.2135.2137.2140.2141.2147.2156.2166.2177.2186.2205.2213.2216.2219.2220.2222.2223.2224.2225.2227.2234.2251.2253.2271.2275.2279.2282.2295.2299.2309.2312.2316.2322.2325.2328.2331.2335.2336.2343.2354.2358.2359.2370.2373.2376.2377.2400.2403.2405.2406.2410.2411.2414.2415.2416.2418.2425.2427.2440.2447.2453.2461.2465.2468.2472.2477.2484.2486.2488.2493.2498.2501.2506.2510.2517.2526.2527.2531.2532.2534.2535.2542.2552.2559.2563.2564.2567.2568.2569.2571.2572.2575.2577.2579.2583.2584.2589.2595.2596.2604.2605.2608.2609.2610.2612.2614.2621.2624.2627.2628.2629.2633.2636.2642.2643.2645.2646.2650.2651.2652.2656.2657.2658.2660.2661.2669.2670.2677.2681.2684.2686.2687.2689.2690.2695.2698.2713.2714.2729.2739.2767.2768.2770.2772.2778.2784.2787.2791.2792.2798.2801.2805.2812.2813.2814.2816.2817.2821.2822.2824.2826.2827.2830.2831.2832.2833.2834.2838.2839.2844.2846.2849.2850.2852.2854.2860.2862.2863.2865.2867.2869.2872.2874.2875.2878.2880.2881.2882.2883.2884.2886.2887.2888.2889.2891.2893.2894.2895.2897.2898.2900.2901.2908.2909.2916.2917.2918.2920.2922.2923.2927.2929.2930.2931.2940.2941.2947.2949.2950.2956.2958.2961.2963.2964.2965.2966.2968.2970.2972.2973.2974.2975.2979.2980.2981.2983.2985.2986.2987.2994.2995.2997.2999.3000.3001.3002.3003.3005.3008.3009.3010.3012.3016.3017.3018.3019.3023.3028.3031.3034.3038.3043.3051.3052.3053.3055.3058.3059.3063.3066.3070.3073.3074.3075.3076.3077.3088.3089.3090.3093.3094.3095.3097.3099.3100.3106.3107.3109.3112.3117.3119.3126.3127.3128.3130.3133.3135.3136.3137.3145.3149.3150.3151.3153.3155.3163.3165.3167.3169.3172.3173.3177.3182.3183.3184.3185.3186.3187.3188.3189.3190.3194.3196.3200.3201.3209.3210.3211.3213.3214.3215.3217.3218.3222.3223.3225.3226.3227.3228.3230.3231.3233.3234.3235.3236.3237.3238.3240.3244.3245.3250.3251.3253.3254.3257.3260.3266.3270.3272.3281.3286.3288.3289.3290.3292.3293.3296.3299.3300.3306.3307.3309.3314.3315.3316.3318.3323.3324.3328.3330.3331.3531.3631.3731.3831.4131.4331.4531.4631.4731.4831.5231.6931.7131.7235.7831.7931.8931.9731.10231.10631.10831.11031.11531.11631.13431.13632.13731.14034.14133.14237.14332.15731.16831.16931.21233.21731.23031.25131.25931.26031.26631.26831.27731.27831.28031.28332.28731.28831.29631.30331.30532.30732.32531.33931.34231.34631.34731.36831.39131.39531.40632.41131.41531.43631.43731.43831.45931.47232.47531.48131.49231.49332.49431.50831.52831.54231.56831.56931.57131.57231.57531.57931.58031.58131; IABGPP_HDR_GppString=DBABMA~CQi298AQi298AAKA9AENCbFgAAAAAEPgAAwIAAAYsABMNDogjLIgUCBQEIIEACgrCACgQBAAAkDRAQAmDAhyBgAusJkAIAUAAwQAgABBgACAAASABCIAIACAQAgQCBQABgAQBAQAMDAAGACxEAgABAdAxTAggECwASIyqDTAhAASCAlsqEEoGBBXCFIscAggREwUAAAIABQAAID4WAhJKCViQQBcQXQAIAAAAUQIsCKQswBBUGaLQVgScBkaYBk-YJklOgiAJghIyDIhNUEg8UxRCghyA2KWYA6eIKAGXayQh_qBYAAA.IMXNR_G__bXlv-bb36btkeYxf9_hr7sQxBgbJs24FzLvW7JwH32E7NEzatqYKmRIAu3TBIQNtHJjURUChKIgVrzDsaE2U4TtKJ-BkiHMZY2tYCFxvm4tjWQCZ4ur_91d9mR-t7dr-2dzy27hnv3a9fuS1UJidKYetHfv8ZBOT-_IU9_x-_4v4_MbpEm8eS1v_tWtt43d64vP_dpuxt-Tyff7____73_e7X__e__33_-qXX_r7____________f__________9__A.YAAAAAAAAAAA; __eoi=ID=d9f8f13e123d6436:T=1776540224:RT=1776540224:S=AA-AfjYYaaTjtEYGC-zZFmO7KI6t; cto_dna_bundle=8zDePF9JVHNrcjNzbXVtRTFDanpDNVdMSzJaanI1UGNuQ0VUck03cURmZlMyQVlCaWk1VG9MS3BNZmR6TDNUMTBvWGVyQmFoNFg2eERVbjhINkdOeXVLVG9wdyUzRCUzRA; _lr_sampling_rate=100")
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
