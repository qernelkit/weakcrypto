package main
import "golang.org/x/crypto/bcrypt"
func demo_cinv_go_0036() {
    _, _ = bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost) // CINV-GO-0036
}
