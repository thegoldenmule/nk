using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Zk.Models;
using Zk.Models.Db;
using Zk.Services;

namespace Zk.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProofController : ControllerBase
    {
        private readonly zkContext _db = new zkContext();
        private readonly ILogger<ProofController> _logger;

        public ProofController(ILogger<ProofController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        [Route("{userId}")]
        public async Task<ProofResponse> Create(string userId)
        {
            // look up user
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
            {
                return new ProofResponse
                {
                    Success = false
                };
            }
            
            // generate proof input
            var value = GenerateRandomString(128);
            
            // encrypt proof input
            var encValueBytes = EncryptionUtility.Encrypt(user.PublicKeyBytes, Convert.FromBase64String(value));
            var encValue = Convert.ToBase64String(encValueBytes);
            
            // store
            await _db.Proofs.AddAsync(new Proof
            {
                PPlaintext = value,
                UserId = userId
            });
            await _db.SaveChangesAsync();
            
            return new ProofResponse
            {
                Success = true,
                Value = encValue
            };
        }

        // TODO: This doesn't generate a string of the correct length.
        private static string GenerateRandomString(int len)
        {
            using var rng = new RNGCryptoServiceProvider();
            
            var data = new byte[len];
            rng.GetBytes(data);

            return Convert.ToBase64String(data);
        }
    }
}