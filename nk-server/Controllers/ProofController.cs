using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TheGoldenMule.Nk.Models.Db;
using TheGoldenMule.Nk.Models.Network;

namespace TheGoldenMule.Nk.Controllers
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
                Value = value
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