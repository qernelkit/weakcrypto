package main
import "crypto/ed25519"
func demo_cinv_go_0021(priv ed25519.PrivateKey) {
    _ = ed25519.Sign(priv, []byte("msg")) // CINV-GO-0021
}
