namespace Zk.Models.Network
{
    public class CreateKeyPairResponse
    {
        public bool Success { get; set; }
        public string Private { get; set; }
        public string Public { get; set; }
    }
}