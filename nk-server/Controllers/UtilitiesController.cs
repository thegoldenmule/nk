using System;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TheGoldenMule.Nk.Models.Network;
using TheGoldenMule.Nk.Services;

namespace TheGoldenMule.Nk.Controllers
{
    [ApiController]
    [Route("utilities")]
    public class UtilitiesController : ControllerBase
    {
        private readonly ILogger<UtilitiesController> _logger;

        public UtilitiesController(ILogger<UtilitiesController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        [Route("encrypt")]
        public EncryptPayloadResponse Encrypt(EncryptPayloadRequest req)
        {
            var publicKey = Convert.FromBase64String(req.PublicKey);
            var plainText = Encoding.UTF8.GetBytes(req.PlainText);
            var cipherBytes = EncryptionUtility.Encrypt(publicKey, plainText);

            return new EncryptPayloadResponse
            {
                Success = true,
                CipherText = Convert.ToBase64String(cipherBytes),
            };
        }

        [HttpPost]
        [Route("decrypt")]
        public DecryptPayloadResponse Decrypt(DecryptPayloadRequest req)
        {
            var privateKey = Convert.FromBase64String(req.PrivateKey);
            var cipherBytes = Convert.FromBase64String(req.CipherText);

            var plainBytes = EncryptionUtility.Decrypt(privateKey, cipherBytes);
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
            var privateKey = Convert.FromBase64String(req.PrivateKey);
            var sigBytes = EncryptionUtility.Sign(cipherBytes, privateKey);
            var sig = Convert.ToBase64String(sigBytes);

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
            var publicKeyBytes = Convert.FromBase64String(req.PublicKey);

            return new VerifyPayloadResponse
            {
                Success = true,
                IsValid = EncryptionUtility.IsValidSig(cipherBytes, sigBytes, publicKeyBytes)
            };
        }
    }
}