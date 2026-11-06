package main
import "crypto/aes"
func demo_cinv_go_0001() {
    key := []byte("0123456789abcdef0123456789abcdef")
    _, _ = aes.NewCipher(key) // CINV-GO-0001
}
