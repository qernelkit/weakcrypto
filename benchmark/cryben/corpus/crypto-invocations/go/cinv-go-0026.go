package main
import "crypto/sha1"
func demo_cinv_go_0026() {
    _ = sha1.New() // CINV-GO-0026 sha1.New
    _ = sha1.Sum([]byte("msg")) // CINV-GO-0026 sha1.Sum
}
