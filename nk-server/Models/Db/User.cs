#nullable disable

namespace TheGoldenMule.Nk.Models.Db
{
    /// <summary>
    /// User model.
    /// </summary>
    public partial class User
    {
        /// <summary>
        /// Id of the user.
        /// </summary>
        public string Id { get; set; }
        
        /// <summary>
        /// Public key of a user.
        /// </summary>
        public string Pk { get; set; }
    }
}
