package main
import ("crypto/ed25519"; "crypto/rand")
func demo_cinv_go_0020() {
    _, _, _ = ed25519.GenerateKey(rand.Reader) // CINV-GO-0020
}
