package retail_test

import (
	"os"
	"testing"

	"github.com/abibby/wishist/services/retail"
	"github.com/go-openapi/testify/v2/assert"
	"github.com/joho/godotenv"
)

func TestFetch(t *testing.T) {
	if os.Getenv("INTEGRATION_TESTS") == "" {
		t.SkipNow()
	}
	godotenv.Load("../../.env")
	tests := []struct {
		name string // description of this test case
		// Named input parameters for target function.
		uri     string
		want    *retail.Product
		wantErr bool
	}{
		{
			name: "open graph",
			uri:  "https://www.dragonsteelbooks.com/collections/leatherbound-books/products/mistborn-leatherbound-book-signed",
			want: &retail.Product{
				Title:       "Mistborn: The Final Empire Leatherbound Book - Signed",
				Description: "Leatherbound Use and Care Suggestions Mistborn Saga Book 1 Like our edition of Elantris, the Dragonsteel edition of Mistborn: The Final Empire is bound in premium bonded-leather, and the pages are smyth-sewn, not glued like most regular books. Mistborn: The Final Empire is printed in 2-color offset black and red inks o",
				Price:       125_00,
				Currency:    "USD",
				URL:         "https://www.dragonsteelbooks.com/products/mistborn-leatherbound-book-signed",
				Image:       "http://www.dragonsteelbooks.com/cdn/shop/files/Untitled_9.png?v=1761661408",
			},
		},
		{
			name: "amazon",
			uri:  "https://www.amazon.ca/OXO-Good-Grips-Food-Scale/dp/B000WJMTNA",
			want: &retail.Product{
				Title:       "OXO Good Grips Good Grips Food Scale",
				Description: "",
				Price:       84_99,
				URL:         "https://www.amazon.ca/OXO-Good-Grips-Food-Scale/dp/B000WJMTNA",
			},
		},
		{
			name: "lego",
			uri:  "https://www.lego.com/en-ca/product/venusaur-charizard-and-blastoise-72153",
			want: &retail.Product{
				Title: "Venusaur, Charizard and Blastoise",
				Description: `Recreate the pinnacle of your Pokémon training journey with the epic Venusaur, Charizard and Blastoise (72153) model building kit for adults. This Pokémon figures set includes 3 iconic Grass-, Fire- and Water-type Pokémon in their final evolutions, evoking memories of your mastery as a Trainer. This epic 6,838-piece set includes 3 Pokémon battle action figures – Venusaur has movable vines and feet, Blastoise has an articulated head, arms and water cannons, and Charizard’s wings, legs, arms and head can be posed. As a surprise, this Pokémon model kit hides an Easter egg waiting to be discovered. Each figure can stand alone or be mounted on a stand that comprises beach, jungle and volcano biomes, representing each Pokémon’s type and making one epic battleground. This building kit is part of a range of LEGO® Sets for Adults (each set sold separately) celebrating a collaboration between 2 beloved brands. Build smarter with the LEGO Builder app where you can zoom, rotate in 3D and track progress.

- EPIC POKÉMON MODEL BUILDING KIT – Relive your thrilling training journey with this LEGO® Pokémon™ Venusaur, Charizard and Blastoise (72153) gaming action figures display set
- 3 ICONIC POKÉMON BATTLE FIGURES – This detailed Pokémon model kit features 3 posable Kanto partner Pokémon in their fierce and final evolution forms, set on beach, jungle and volcano stands
- DYNAMIC DISPLAY PIECE – Each Pokémon figure can stand alone posed into a battle stance or be mounted on its biome stand, each of which can be connected to form one epic battleground
- IMMERSIVE BUILD – These highly detailed Pokémon action figures with articulated limbs provide a rewarding build for experienced LEGO® enthusiasts, making a stunning piece of game room decor
- GAMERGIFT – This nostalgia gift for Pokémon fans is a great present idea for gamer parents or any LEGO® lover ages 18 plus
- MASTER-LEVEL PARTNERSHIP – This desk decor building kit is part of a range of LEGO® Sets for Adults that brings together 2 beloved global brands for the first time to form one epic collaboration
- 3D BUILDING INSTRUCTIONS – Get ready to build like never before with the LEGO® Builder app, where you can save sets, track your progress, zoom in and rotate your set with 3D building instructions
- DIMENSIONS – This 6,838-piece collectible Pokémon building set includes Venusaur, Charizard and Blastoise figures that stand over 9 in. (23 cm), 8 in. (20 cm) and 7 in. (18 cm) tall respectively`,
				Price:    899_99,
				URL:      "https://www.lego.com/en-ca/product/venusaur-charizard-and-blastoise-72153",
				Image:    "https://images.brickset.com/sets/images/72153-1.jpg",
				Currency: "CAD",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, gotErr := retail.Fetch(tt.uri)
			if gotErr != nil {
				if !tt.wantErr {
					t.Errorf("Fetch() failed: %v", gotErr)
				}
				return
			}
			if tt.wantErr {
				t.Fatal("Fetch() succeeded unexpectedly")
			}

			assert.Equal(t, tt.want, got)
		})
	}
}
