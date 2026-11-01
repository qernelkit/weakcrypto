package argon2
func IDKey(password, salt []byte, time uint32, memory uint32, threads uint8, keyLen uint32) []byte { return make([]byte, keyLen) }
