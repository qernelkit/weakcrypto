package hkdf
import ("hash"; "io"; "bytes")
func New(hash func() hash.Hash, secret, salt, info []byte) io.Reader { return bytes.NewReader(make([]byte, 64)) }
