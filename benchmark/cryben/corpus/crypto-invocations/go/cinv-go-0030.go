package main
import "crypto/x509"
func demo_cinv_go_0030(der []byte) {
    _, _ = x509.ParsePKCS1PrivateKey(der) // CINV-GO-0030
}
