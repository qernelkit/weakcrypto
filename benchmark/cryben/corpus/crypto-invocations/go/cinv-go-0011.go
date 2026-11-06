package main
import "crypto/rand"
func demo_cinv_go_0011() {
    buf := make([]byte, 32)
    _, _ = rand.Read(buf) // CINV-GO-0011
}
