package main
import ("crypto/sha256"; "golang.org/x/crypto/pbkdf2")
func demo_cinv_go_0040() {
    _ = pbkdf2.Key([]byte("password"), []byte("salt"), 100000, 32, sha256.New) // CINV-GO-0040
}
