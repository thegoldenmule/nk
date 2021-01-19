namespace TheGoldenMule.Nk.Models.Network
{
    public class GetKeysResponse
    {
        public bool Success { get; set; }
        public string Error { get; set; }
        public string[] Keys { get; set; }
    }
}