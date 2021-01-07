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
    [Route("utilities")]
    public class EncryptionController : ControllerBase
    {
        private readonly zkContext _db = new zkContext();
        private readonly ILogger<EncryptionController> _logger;

        public EncryptionController(ILogger<EncryptionController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        [Route("encrypt")]
        public EncryptPayloadResponse Encrypt(EncryptPayloadRequest req)
        {
            var publicKey = Convert.FromBase64String(req.PublicKey);
            var plainText = Encoding.UTF8.GetBytes(req.PlainText);
            
            using var rsa = RSA.Create();
            rsa.ImportRSAPublicKey(new ReadOnlySpan<byte>(publicKey), out _);

            var cipherBytes = rsa.Encrypt(plainText, RSAEncryptionPadding.Pkcs1);
            var cipherText = Convert.ToBase64String(cipherBytes);

            return new EncryptPayloadResponse
            {
                Success = true,
                CipherText = cipherText,
            };
        }
        
        [HttpPost]
        [Route("decrypt")]
        public DecryptPayloadResponse Decrypt(DecryptPayloadRequest req)
        {
            var privateKey = Convert.FromBase64String(req.PrivateKey);
            var cipherBytes = Convert.FromBase64String(req.CipherText);

            using var rsa = RSA.Create();
            rsa.ImportRSAPrivateKey(new ReadOnlySpan<byte>(privateKey), out _);

            var plainBytes = rsa.Decrypt(cipherBytes, RSAEncryptionPadding.Pkcs1);
            var plainText = Encoding.UTF8.GetString(plainBytes);

            return new DecryptPayloadResponse
            {
                Success = true,
                PlainText = plainText
            };
        }

        [HttpPost]
        [Route("sign")]
        public SignPayloadResponse Sign(SignPayloadRequest req)
        {
            var cipherBytes = Convert.FromBase64String(req.CipherText);

            byte[] hash;
            using (var alg = SHA512.Create())
            {
                hash = alg.ComputeHash(cipherBytes);
            }
            
            var privateKey = Convert.FromBase64String(req.PrivateKey);
            using var rsa = RSA.Create();
            rsa.ImportRSAPrivateKey(new ReadOnlySpan<byte>(privateKey), out _);
            
            var formatter = new RSAPKCS1SignatureFormatter(rsa);
            formatter.SetHashAlgorithm("SHA512");
            
            var sig = Convert.ToBase64String(formatter.CreateSignature(hash));

            return new SignPayloadResponse
            {
                Success = true,
                Sig = sig
            };
        }
        
        [HttpPost]
        [Route("verify")]
        public VerifyPayloadResponse Verify(VerifyPayloadRequest req)
        {
            var cipherBytes = Convert.FromBase64String(req.CipherText);
            var sigBytes = Convert.FromBase64String(req.Sig);

            byte[] cipherHash;
            using (var alg = SHA512.Create())
            {
                cipherHash = alg.ComputeHash(cipherBytes);
            }
            
            var publicKeyBytes = Convert.FromBase64String(req.PublicKey);
            using var rsa = RSA.Create();
            rsa.ImportRSAPublicKey(new ReadOnlySpan<byte>(publicKeyBytes), out _);
            
            var deformatter = new RSAPKCS1SignatureDeformatter(rsa);
            deformatter.SetHashAlgorithm("SHA512");

            return new VerifyPayloadResponse
            {
                Success = true,
                IsValid = deformatter.VerifySignature(cipherHash, sigBytes)
            };
        }
    }
}