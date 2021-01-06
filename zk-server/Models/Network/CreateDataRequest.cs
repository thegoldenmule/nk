namespace Zk.Models
{
    public class CreateDataRequest
    {
        public string Key { get; set; }
        public string Payload { get; set; }
        public string Sig { get; set; }
    }
}