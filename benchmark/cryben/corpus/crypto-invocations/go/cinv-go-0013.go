package main
import ("crypto/rand"; "crypto/rsa"; "crypto/sha256")
func demo_cinv_go_0013(pub *rsa.PublicKey) {
    label := []byte("benchmark")
    _, _ = rsa.EncryptOAEP(sha256.New(), rand.Reader, pub, []byte("msg"), label) // CINV-GO-0013
}
