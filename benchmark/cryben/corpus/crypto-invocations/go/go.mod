module cbom-benchmark-go

go 1.22

// golang.org/x/crypto v0.0.0-20190308221718-c7ac8abb3a96 is vulnerable to
// CVE-2019-11840 (nonce reuse in ChaCha20/Salsa20 when >2^32 nonces generated).
// Included intentionally as a benchmark asset for dependency vulnerability detection.
require golang.org/x/crypto v0.0.0-20190308221718-c7ac8abb3a96
