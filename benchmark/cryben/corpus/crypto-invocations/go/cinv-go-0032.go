package main
import "crypto/tls"
func demo_cinv_go_0032() {
    _ = &tls.Config{MinVersion: tls.VersionTLS12, CipherSuites: []uint16{tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256}} // CINV-GO-0032 tls.Config
}
