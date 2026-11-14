package pbkdf2
import "hash"
func Key(password, salt []byte, iter, keyLen int, h func() hash.Hash) []byte { return make([]byte, keyLen) }
