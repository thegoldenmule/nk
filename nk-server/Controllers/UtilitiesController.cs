using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TheGoldenMule.Nk.Models.Network;
using TheGoldenMule.Nk.Services;

namespace TheGoldenMule.Nk.Controllers
{
    /// <summary>
    /// This controller is for testing purposes only.
    /// </summary>
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
            var cipherBytes = Encrypt(publicKey, plainText);

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

            var plainBytes = Decrypt(privateKey, cipherBytes);
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
            var sigBytes = Sign(cipherBytes, privateKey);
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
            
            return new VerifyPayloadResponse
            {
                Success = true,
                IsValid = EncryptionUtility.IsValidSig(cipherBytes, sigBytes, req.PublicKey.ToCharArray())
            };
        }
        
        /// <summary>
        /// NOT to be used in production. Signing is only done with private key.
        /// </summary>
        private static byte[] Sign(byte[] cipherText, byte[] privateKey, string alg = "SHA512")
        {
            byte[] hash;
            using (var hashFn = EncryptionUtility.Algorithm(alg))
            {
                hash = hashFn.ComputeHash(cipherText);
            }
            
            using var rsa = RSA.Create();
            rsa.ImportRSAPrivateKey(new ReadOnlySpan<byte>(privateKey), out _);
            
            var formatter = new RSAPKCS1SignatureFormatter(rsa);
            formatter.SetHashAlgorithm(alg);
            
            return formatter.CreateSignature(hash);
        }
        
        /// <summary>
        /// NOT to be used in production. Encryption with signing key is un-necessary
        /// and potentially dangerous. 
        /// </summary>
        private static byte[] Encrypt(byte[] publicKey, byte[] plainText)
        {
            using var rsa = RSA.Create();
            rsa.ImportRSAPublicKey(new ReadOnlySpan<byte>(publicKey), out _);

            return rsa.Encrypt(plainText, RSAEncryptionPadding.Pkcs1);
        }

        /// <summary>
        /// NOT to be used in production. Decryption with signing key is un-necessary
        /// and potentially dangerous. 
        /// </summary>
        private static byte[] Decrypt(byte[] privateKey, byte[] cipherText)
        {
            using var rsa = RSA.Create();
            rsa.ImportRSAPrivateKey(new ReadOnlySpan<byte>(privateKey), out _);

            return rsa.Decrypt(cipherText, RSAEncryptionPadding.Pkcs1);
        }
    }
}