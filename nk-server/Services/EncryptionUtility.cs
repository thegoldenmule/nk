using System;
using System.Security.Cryptography;

namespace TheGoldenMule.Nk.Services
{
    public class EncryptionUtility
    {
        public static bool IsValidPublicKey(char[] publicKey)
        {
            using var rsa = RSA.Create();
            try
            {
                rsa.ImportFromPem(new ReadOnlySpan<char>(publicKey));
            }
            catch
            {
                return false;
            }

            return true;
        }
        
        public static bool IsValidSig(byte[] cipherText, byte[] sig, char[] publicKey, string alg = "SHA512")
        {
            byte[] hash;
            using (var hashFn = Algorithm(alg))
            {
                hash = hashFn.ComputeHash(cipherText);
            }
            
            using var rsa = RSA.Create();
            rsa.ImportFromPem(new ReadOnlySpan<char>(publicKey));
            
            var deformatter = new RSAPKCS1SignatureDeformatter(rsa);
            deformatter.SetHashAlgorithm(alg);

            return deformatter.VerifySignature(hash, sig);
        }

        public static HashAlgorithm Algorithm(string alg)
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