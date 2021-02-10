#nullable disable

namespace TheGoldenMule.Nk.Models.Db
{
    /// <summary>
    /// Model for proofs.
    /// </summary>
    public partial class Proof
    {
        /// <summary>
        /// Unique id of the proof.
        /// </summary>
        public int Id { get; set; }
        
        /// <summary>
        /// Plaintext value.
        /// </summary>
        public string PPlaintext { get; set; }
        
        /// <summary>
        /// Id of the user.
        /// </summary>
        public string UserId { get; set; }
    }
}
