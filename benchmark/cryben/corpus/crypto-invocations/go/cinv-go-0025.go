package main
import "crypto/md5"
func demo_cinv_go_0025() {
    _ = md5.New() // CINV-GO-0025 md5.New
    _ = md5.Sum([]byte("msg")) // CINV-GO-0025 md5.Sum
}
