namespace TheGoldenMule.Nk.Models.Db
{
    public partial class User
    {
        public char[] PublicKeyChars => Pk.ToCharArray();
    }
}