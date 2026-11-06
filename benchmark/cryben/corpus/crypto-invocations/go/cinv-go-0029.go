package main
import "crypto/x509"
func demo_cinv_go_0029(der []byte) {
    _, _ = x509.ParsePKCS8PrivateKey(der) // CINV-GO-0029
}
