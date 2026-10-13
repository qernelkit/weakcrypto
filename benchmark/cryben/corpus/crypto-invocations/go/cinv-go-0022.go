package main
import "crypto/ed25519"
func demo_cinv_go_0022(pub ed25519.PublicKey, sig []byte) {
    _ = ed25519.Verify(pub, []byte("msg"), sig) // CINV-GO-0022
}
