package main
import ("crypto/aes"; "crypto/cipher")
func demo_cinv_go_0005() {
    block, _ := aes.NewCipher([]byte("0123456789abcdef0123456789abcdef"))
    _, _ = cipher.NewGCMWithNonceSize(block, 12) // CINV-GO-0005
}
