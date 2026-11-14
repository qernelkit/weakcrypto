package main
import ("crypto/hmac"; "crypto/sha256")
func demo_cinv_go_0023() {
    _ = hmac.New(sha256.New, []byte("secret")) // CINV-GO-0023
}
