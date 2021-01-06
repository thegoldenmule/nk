using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Zk.Models.Db;
using Zk.Models.Network;

namespace Zk.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class EncryptionController : ControllerBase
    {
        private readonly zkContext _db = new zkContext();
        private readonly ILogger<EncryptionController> _logger;

        public EncryptionController(ILogger<EncryptionController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public EncryptPayloadResponse Encrypt(EncryptPayloadRequest req)
        {
            var key = Convert.FromBase64String(req.PrivateKey);
            var plaintext = Encoding.UTF8.GetBytes(req.PlainText);
            
            using var rsa = RSA.Create();
            rsa.ImportRSAPrivateKey(new ReadOnlySpan<byte>(key), out _);

            var cipherBytes = rsa.Encrypt(plaintext, RSAEncryptionPadding.Pkcs1);
            var ciphertext = Convert.ToBase64String(cipherBytes);

            byte[] hash;
            using (var alg = SHA512.Create())
            {
                hash = alg.ComputeHash(cipherBytes);
            }
            
            var formatter = new RSAPKCS1SignatureFormatter(rsa);
            formatter.SetHashAlgorithm("SHA512");
            
            var sig = Convert.ToBase64String(formatter.CreateSignature(hash));

            return new EncryptPayloadResponse
            {
                Success = true,
                CipherText = ciphertext,
                Sig = sig
            };
        }
    }
}