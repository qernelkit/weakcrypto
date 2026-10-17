package main
import ("crypto/rand"; "crypto/rsa"; "crypto/x509"; "math/big"; "time")
func demo_cinv_go_0028() {
    key, _ := rsa.GenerateKey(rand.Reader, 2048)
    tmpl := &x509.Certificate{SerialNumber: big.NewInt(1), NotBefore: time.Now(), NotAfter: time.Now().Add(time.Hour)}
    _, _ = x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key) // CINV-GO-0028
}
