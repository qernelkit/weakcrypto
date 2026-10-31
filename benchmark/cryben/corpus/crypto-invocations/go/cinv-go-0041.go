package main
import ("crypto/sha256"; "golang.org/x/crypto/hkdf")
func demo_cinv_go_0041() {
    _ = hkdf.New(sha256.New, []byte("secret"), []byte("salt"), []byte("info")) // CINV-GO-0041
}
