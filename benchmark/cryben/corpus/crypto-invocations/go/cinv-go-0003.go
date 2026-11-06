package main
import "crypto/des"
func demo_cinv_go_0003() {
    key := []byte("123456789012345678901234")
    _, _ = des.NewTripleDESCipher(key) // CINV-GO-0003
}
