using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TheGoldenMule.Nk.Models.Db;
using TheGoldenMule.Nk.Models.Network;

namespace TheGoldenMule.Nk.Controllers
{
    /// <summary>
    /// Provides endpoints for proof generation.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class ProofController : ControllerBase
    {
        /// <summary>
        /// Creates a proof for a user.
        /// </summary>
        /// <param name="userId">The id of a user.</param>
        [HttpPost]
        [Route("{userId}")]
        public async Task<ProofResponse> Create(string userId)
        {
            // look up user
            await using var db = new NkContext();
            var user = await db.Users.FindAsync(userId);
            if (user == null)
            {
                return new ProofResponse
                {
                    Success = false
                };
            }
            
            // generate proof input
            var value = GenerateRandomString(128);
            
            // store
            await db.Proofs.AddAsync(new Proof
            {
                PPlaintext = value,
                UserId = userId
            });
            await db.SaveChangesAsync();
            
            return new ProofResponse
            {
                Success = true,
                Value = value
            };
        }

        /// <summary>
        /// Generates a string of a given byte length.
        /// </summary>
        /// <param name="len">The length, in bytes, not the resulting string.</param>
        /// <returns></returns>
        private static string GenerateRandomString(int len)
        {
            using var rng = new RNGCryptoServiceProvider();
            
            var data = new byte[len];
            rng.GetBytes(data);

            return Convert.ToBase64String(data);
        }
    }
}