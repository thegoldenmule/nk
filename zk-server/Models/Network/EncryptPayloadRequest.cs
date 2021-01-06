namespace Zk.Models.Network
{
    public class EncryptPayloadRequest
    {
        public string PrivateKey { get; set; }
        public string PlainText { get; set; }
    }

    public class EncryptPayloadResponse
    {
        public bool Success { get; set; }
        public string CipherText { get; set; }
        public string Sig { get; set; }
    }
}