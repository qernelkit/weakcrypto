package main
import "golang.org/x/crypto/chacha20poly1305"
func demo_cinv_go_0042() {
    key := make([]byte, chacha20poly1305.KeySize)
    _, _ = chacha20poly1305.New(key) // CINV-GO-0042
}
