package main
import "crypto/tls"
func demo_cinv_go_0034() {
    _, _ = tls.Dial("tcp", "example.invalid:443", &tls.Config{MinVersion: tls.VersionTLS12}) // CINV-GO-0034 tls.Dial
    _, _ = tls.DialWithDialer(nil, "tcp", "example.invalid:443", &tls.Config{MinVersion: tls.VersionTLS12}) // CINV-GO-0034 tls.DialWithDialer
}
