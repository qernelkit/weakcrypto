package main
import "golang.org/x/crypto/chacha20poly1305"
func demo_cinv_go_0043() {
    key := make([]byte, chacha20poly1305.KeySizeX)
    _, _ = chacha20poly1305.NewX(key) // CINV-GO-0043
}
