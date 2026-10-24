package main
import "golang.org/x/crypto/ssh"
func demo_cinv_go_0044(pemBytes []byte) {
    _, _ = ssh.ParsePrivateKey(pemBytes) // CINV-GO-0044
}
