package main
import ("crypto/rsa"; "crypto"; "crypto/sha256")
func demo_cinv_go_0016(pub *rsa.PublicKey, sig []byte) {
    digest := sha256.Sum256([]byte("msg"))
    _ = rsa.VerifyPSS(pub, crypto.SHA256, digest[:], sig, nil) // CINV-GO-0016
}
