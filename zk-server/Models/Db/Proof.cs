﻿using System;
using System.Collections.Generic;

#nullable disable

namespace Zk.Models.Db
{
    public partial class Proof
    {
        public int Id { get; set; }
        public string PPlaintext { get; set; }
        public string UserId { get; set; }
    }
}
