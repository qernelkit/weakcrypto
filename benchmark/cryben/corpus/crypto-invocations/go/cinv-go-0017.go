package main
import ("crypto/ecdsa"; "crypto/elliptic"; "crypto/rand")
func demo_cinv_go_0017() {
    _, _ = ecdsa.GenerateKey(elliptic.P256(), rand.Reader) // CINV-GO-0017
}
