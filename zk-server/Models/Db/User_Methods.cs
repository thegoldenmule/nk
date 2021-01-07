using System;

namespace Zk.Models.Db
{
    public partial class User
    {
        public byte[] PublicKeyBytes => Convert.FromBase64String(Pk);
    }
}