﻿using System;
using System.Collections.Generic;

#nullable disable

namespace zk_server.Models
{
    public partial class Datum
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Key { get; set; }
        public string Data { get; set; }
    }
}
