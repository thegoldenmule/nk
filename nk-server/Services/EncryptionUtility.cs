using System;
using System.Security.Cryptography;

namespace TheGoldenMule.Nk.Services
{
    /// <summary>
    /// Takes care of basic encryption needs.
    /// </summary>
    public class EncryptionUtility
    {
        /// <summary>
        /// True iff the input is a valid public key, PEM formatted.
        /// </summary>
        /// <param name="publicKey">The public key characters.</param>
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
        
        /// <summary>
        /// True iff the provided signature is valid for the cipher text.
        /// </summary>
        /// <param name="cipherText">The buffer that has been signed.</param>
        /// <param name="sig">The signature.</param>
        /// <param name="publicKey">The public key, in PEM form.</param>
        /// <param name="alg">The hashing algorithm.</param>
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

        /// <summary>
        /// Retrieves the correct hashing algorithm from a string.
        /// </summary>
        /// <param name="alg">The string name.</param>
        /// <returns></returns>
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