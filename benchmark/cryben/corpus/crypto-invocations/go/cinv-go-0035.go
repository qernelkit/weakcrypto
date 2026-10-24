package main
import "crypto/tls"
func demo_cinv_go_0035() {
    _, _ = tls.LoadX509KeyPair("server.crt", "server.key") // CINV-GO-0035
}
