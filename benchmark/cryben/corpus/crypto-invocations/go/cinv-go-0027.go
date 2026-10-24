package main
import "crypto/x509"
func demo_cinv_go_0027(der []byte) {
    _, _ = x509.ParseCertificate(der) // CINV-GO-0027
}
