package main
import ("crypto/rand"; "crypto/rsa"; "crypto"; "crypto/sha256")
func demo_cinv_go_0015(priv *rsa.PrivateKey) {
    digest := sha256.Sum256([]byte("msg"))
    _, _ = rsa.SignPSS(rand.Reader, priv, crypto.SHA256, digest[:], nil) // CINV-GO-0015
}
