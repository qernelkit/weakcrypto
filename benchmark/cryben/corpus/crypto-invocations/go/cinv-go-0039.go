package main
import "golang.org/x/crypto/scrypt"
func demo_cinv_go_0039() {
    _, _ = scrypt.Key([]byte("password"), []byte("saltsaltsaltsalt"), 32768, 8, 1, 32) // CINV-GO-0039
}
