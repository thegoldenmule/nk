#nullable disable

namespace TheGoldenMule.Nk.Models.Db
{
    /// <summary>
    /// Data model for data.
    /// </summary>
    public partial class Datum
    {
        /// <summary>
        /// Unique id of the data.
        /// </summary>
        public int Id { get; set; }
        
        /// <summary>
        /// User id this data belongs to.
        /// </summary>
        public string UserId { get; set; }
        
        /// <summary>
        /// Key of the data.
        /// </summary>
        public string Key { get; set; }
        
        /// <summary>
        /// The data.
        /// </summary>
        public string Data { get; set; }
        
        /// <summary>
        /// Iv associated with the data.
        /// </summary>
        public string Iv { get; set; }
    }
}
