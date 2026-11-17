package main
import "golang.org/x/crypto/argon2"
func demo_cinv_go_0038() {
    _ = argon2.IDKey([]byte("password"), []byte("saltsaltsaltsalt"), 1, 64*1024, 4, 32) // CINV-GO-0038
}
