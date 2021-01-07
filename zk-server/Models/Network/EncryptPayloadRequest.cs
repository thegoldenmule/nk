namespace Zk.Models.Network
{
    public class EncryptPayloadRequest
    {
        public string PublicKey { get; set; }
        public string PlainText { get; set; }
    }

    public class EncryptPayloadResponse
    {
        public bool Success { get; set; }
        public string CipherText { get; set; }
    }

    public class SignPayloadRequest
    {
        public string PrivateKey { get; set; }
        public string CipherText { get; set; }
    }

    public class SignPayloadResponse
    {
        public bool Success { get; set; }
        public string Sig { get; set; }
    }

    public class VerifyPayloadRequest
    {
        public string PublicKey { get; set; }
        public string CipherText { get; set; }
        public string Sig { get; set; }
    }

    public class VerifyPayloadResponse
    {
        public bool Success { get; set; }
        public bool IsValid { get; set; }
    }
    
    public class DecryptPayloadRequest
    {
        public string PrivateKey { get; set; }
        public string CipherText { get; set; }
    }

    public class DecryptPayloadResponse
    {
        public bool Success { get; set; }
        public string PlainText { get; set; }
    }
}