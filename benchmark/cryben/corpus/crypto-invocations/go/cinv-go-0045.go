package main
import ("golang.org/x/crypto/ssh"; "crypto/rsa")
func demo_cinv_go_0045(key *rsa.PrivateKey) {
    _, _ = ssh.NewSignerFromKey(key) // CINV-GO-0045
}
