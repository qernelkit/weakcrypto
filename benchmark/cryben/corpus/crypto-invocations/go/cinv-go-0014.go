package main
import ("crypto/rand"; "crypto/rsa"; "crypto/sha256")
func demo_cinv_go_0014(priv *rsa.PrivateKey, ciphertext []byte) {
    label := []byte("benchmark")
    _, _ = rsa.DecryptOAEP(sha256.New(), rand.Reader, priv, ciphertext, label) // CINV-GO-0014
}
