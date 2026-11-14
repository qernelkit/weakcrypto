package main
import ("crypto/rand"; "crypto/rsa")
func demo_cinv_go_0012() {
    _, _ = rsa.GenerateKey(rand.Reader, 2048) // CINV-GO-0012
}
