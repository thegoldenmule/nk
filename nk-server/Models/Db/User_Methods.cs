namespace TheGoldenMule.Nk.Models.Db
{
    /// <summary>
    /// Methods for the User object.
    /// </summary>
    public partial class User
    {
        /// <summary>
        /// Public key to character array.
        /// </summary>
        public char[] PublicKeyChars => Pk.ToCharArray();
    }
}