package main
import ("crypto/aes"; "crypto/cipher")
func demo_cinv_go_0004() {
    block, _ := aes.NewCipher([]byte("0123456789abcdef0123456789abcdef"))
    _, _ = cipher.NewGCM(block) // CINV-GO-0004
}
