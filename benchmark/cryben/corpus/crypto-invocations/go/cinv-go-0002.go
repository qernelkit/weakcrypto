package main
import "crypto/des"
func demo_cinv_go_0002() {
    key := []byte("12345678")
    _, _ = des.NewCipher(key) // CINV-GO-0002
}
