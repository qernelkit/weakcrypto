package main
import ("crypto/aes"; "crypto/cipher")
func demo_cinv_go_0009() {
    block, _ := aes.NewCipher([]byte("0123456789abcdef"))
    iv := []byte("1234567890abcdef")
    _ = cipher.NewCFBEncrypter(block, iv) // CINV-GO-0009
}
