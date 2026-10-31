package main
import "golang.org/x/crypto/bcrypt"
func demo_cinv_go_0037(hash []byte) {
    _ = bcrypt.CompareHashAndPassword(hash, []byte("password")) // CINV-GO-0037
}
