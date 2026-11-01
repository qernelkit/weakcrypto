package main
import "crypto/tls"
func demo_cinv_go_0033() {
    _, _ = tls.Listen("tcp", "127.0.0.1:0", &tls.Config{MinVersion: tls.VersionTLS12}) // CINV-GO-0033
}
