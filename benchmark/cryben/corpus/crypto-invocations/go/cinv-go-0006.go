package main
import ("crypto/aes"; "crypto/cipher")
func demo_cinv_go_0006() {
    block, _ := aes.NewCipher([]byte("0123456789abcdef"))
    iv := []byte("1234567890abcdef")
    _ = cipher.NewCBCEncrypter(block, iv) // CINV-GO-0006
}
