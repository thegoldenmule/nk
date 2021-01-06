using System;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Zk.Models.Db;
using Zk.Models.Network;

namespace Zk.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class KeyController : ControllerBase
    {
        private readonly zkContext _db = new zkContext();
        private readonly ILogger<KeyController> _logger;

        public KeyController(ILogger<KeyController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public CreateKeyPairResponse Create()
        {
            var rsa = RSA.Create();
            var privateKey = rsa.ExportRSAPrivateKey();
            var publicKey = rsa.ExportRSAPublicKey();

            return new CreateKeyPairResponse
            {
                Public = Convert.ToBase64String(publicKey),
                Private = Convert.ToBase64String(privateKey)
            };
        }
    }
}