package main
import "crypto/x509"
func demo_cinv_go_0031(pemBytes []byte) {
    pool := x509.NewCertPool()
    _ = pool.AppendCertsFromPEM(pemBytes) // CINV-GO-0031
}
