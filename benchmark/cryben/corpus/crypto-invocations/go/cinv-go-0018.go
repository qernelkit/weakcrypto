package main
import ("crypto/ecdsa"; "crypto/rand"; "crypto/sha256")
func demo_cinv_go_0018(priv *ecdsa.PrivateKey) {
    digest := sha256.Sum256([]byte("msg"))
    _, _ = ecdsa.SignASN1(rand.Reader, priv, digest[:]) // CINV-GO-0018
}
