package chacha20poly1305
import "crypto/cipher"
const KeySize = 32
const KeySizeX = 32
type dummy struct{}
func (d dummy) NonceSize() int { return 12 }
func (d dummy) Overhead() int { return 16 }
func (d dummy) Seal(dst, nonce, plaintext, additionalData []byte) []byte { return append(dst, plaintext...) }
func (d dummy) Open(dst, nonce, ciphertext, additionalData []byte) ([]byte, error) { return append(dst, ciphertext...), nil }
func New(key []byte) (cipher.AEAD, error) { return dummy{}, nil }
func NewX(key []byte) (cipher.AEAD, error) { return dummy{}, nil }
