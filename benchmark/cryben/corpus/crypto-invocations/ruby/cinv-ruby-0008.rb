# frozen_string_literal: true
# Standalone benchmark fixture with safe local fallbacks for optional frameworks.
begin
  require 'openssl'
  require 'securerandom'
  require 'net/http'
  require 'socket'
rescue LoadError
end

module ActiveSupport
  class MessageEncryptor
    def self.key_len(*args); 32; end
    def initialize(*args); end
    def encrypt_and_sign(v); "enc:#{v}"; end
    def decrypt_and_verify(v); v.to_s; end
  end
  class MessageVerifier
    def initialize(*args); end
    def generate(v); "sig:#{v}"; end
    def verified(v); v; end
    def verify(v); v; end
  end
  class KeyGenerator
    def initialize(*args); end
    def generate_key(*args)
      len = args.last.is_a?(Integer) ? args.last : 32
      "k" * len
    end
  end
  class CachingKeyGenerator
    def initialize(generator); @generator = generator; end
    def fetch(*args); generate_key(*args); end
    def generate_key(*args); @generator.generate_key(*args); end
  end
end

module BCrypt
  class Password
    def self.create(v, **kwargs); new(v); end
    def initialize(v); @v = v; end
    def ==(other); other.to_s == @v.to_s; end
  end
end

module JWT
  def self.encode(payload, key, algorithm = 'HS256'); "jwt.#{algorithm}.token"; end
  def self.decode(token, key, verify = true, options = {}); [{ token: token }, { 'alg' => options[:algorithm] || 'HS256' }]; end
end

def benchmark_ok
  yield
rescue StandardError => e
  warn "#{File.basename(__FILE__)} tolerated runtime setup error: #{e.class}: #{e.message}"
end

benchmark_ok do
  OpenSSL::KDF.pbkdf2_hmac('password', salt: 'salt', iterations: 1000, length: 32, hash: 'SHA256') # CINV-RUBY-0008
end
