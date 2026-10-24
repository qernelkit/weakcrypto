package main
import ("crypto/ecdsa"; "crypto/sha256")
func demo_cinv_go_0019(pub *ecdsa.PublicKey, sig []byte) {
    digest := sha256.Sum256([]byte("msg"))
    _ = ecdsa.VerifyASN1(pub, digest[:], sig) // CINV-GO-0019
}
