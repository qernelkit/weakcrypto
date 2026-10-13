package main
import ("crypto/aes"; "crypto/cipher")
func demo_cinv_go_0010() {
    block, _ := aes.NewCipher([]byte("0123456789abcdef"))
    iv := []byte("1234567890abcdef")
    _ = cipher.NewOFB(block, iv) // CINV-GO-0010
}
