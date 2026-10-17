package main
import "crypto/sha256"
func demo_cinv_go_0024() {
    _ = sha256.New() // CINV-GO-0024 sha256.New
    _ = sha256.Sum256([]byte("msg")) // CINV-GO-0024 sha256.Sum256
}
