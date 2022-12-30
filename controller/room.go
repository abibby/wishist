package controller

import (
	"log"
	"net/http"

	"github.com/abibby/validate"
	"github.com/gorilla/websocket"
)

var rooms = map[string][]*websocket.Conn{}

var upgrader = websocket.Upgrader{} // use default options

type RoomRequest struct{}

func Room(w http.ResponseWriter, r *http.Request) {
	rr := &RoomRequest{}
	err := validate.Run(r, rr)
	if err != nil {
		return
	}
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()
	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		log.Printf("recv: %s", message)
		err = c.WriteMessage(mt, message)
		if err != nil {
			log.Println("write:", err)
			break
		}
	}
}
