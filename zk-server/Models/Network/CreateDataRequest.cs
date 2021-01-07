namespace zk_server.Models
{
    public class CreateDataRequest
    {
        public string Key { get; set; }
        public string Payload { get; set; }
        public string Sig { get; set; }
        public string Alg { get; set; }
    }
}