package ssh
type Signer interface{}
func ParsePrivateKey(pemBytes []byte) (Signer, error) { return nil, nil }
func NewSignerFromKey(key any) (Signer, error) { return nil, nil }
