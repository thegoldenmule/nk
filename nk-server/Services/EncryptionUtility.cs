using System;
using System.Security.Cryptography;

namespace TheGoldenMule.Nk.Services
{
    public class EncryptionUtility
    {
        public static byte[] Encrypt(byte[] publicKey, byte[] plainText)
        {
            using var rsa = RSA.Create();
            rsa.ImportRSAPublicKey(new ReadOnlySpan<byte>(publicKey), out _);

            return rsa.Encrypt(plainText, RSAEncryptionPadding.Pkcs1);
        }

        public static byte[] Decrypt(byte[] privateKey, byte[] cipherText)
        {
            using var rsa = RSA.Create();
            rsa.ImportRSAPrivateKey(new ReadOnlySpan<byte>(privateKey), out _);

            return rsa.Decrypt(cipherText, RSAEncryptionPadding.Pkcs1);
        }

        public static byte[] Sign(byte[] cipherText, byte[] privateKey, string alg = "SHA512")
        {
            byte[] hash;
            using (var hashFn = Alg(alg))
            {
                hash = hashFn.ComputeHash(cipherText);
            }
            
            using var rsa = RSA.Create();
            rsa.ImportRSAPrivateKey(new ReadOnlySpan<byte>(privateKey), out _);
            
            var formatter = new RSAPKCS1SignatureFormatter(rsa);
            formatter.SetHashAlgorithm(alg);
            
            return formatter.CreateSignature(hash);
        }

        public static bool IsValidSig(byte[] cipherText, byte[] sig, byte[] publicKey, string alg = "SHA512")
        {
            byte[] hash;
            using (var hashFn = Alg(alg))
            {
                hash = hashFn.ComputeHash(cipherText);
            }
            
            using var rsa = RSA.Create();
            rsa.ImportRSAPublicKey(new ReadOnlySpan<byte>(publicKey), out _);
            
            var deformatter = new RSAPKCS1SignatureDeformatter(rsa);
            deformatter.SetHashAlgorithm(alg);

            return deformatter.VerifySignature(hash, sig);
        }

        private static HashAlgorithm Alg(string alg)
        {
            switch (alg)
            {
                default:
                {
                    return SHA512.Create();
                }
                case "SHA256":
                {
                    return SHA256.Create();
                }
                case "SHA1":
                {
                    return SHA1.Create();
                }
            }
        }
    }
}