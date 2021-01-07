using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using zk_server.Models;
using zk_server.Models.Db;

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
        public async Task<ProofResponse> Create(ProofRequest req)
        {
            // look up public key
            var user = await _db.Users.FindAsync(req.UserId);
            if (user == null)
            {
                return new ProofResponse
                {
                    Success = false
                };
            }
            
            // generate p_plaintext
            var plaintext = GenerateRandomString(1024);
            /*
            // generate p_ciphertext
            var ciphertext = Encrypt(plaintext, user.Pk);
            
            // save proof
            var proof = new Proof
            {
                PPlaintext = plaintext,
                UserId = user.Id
            };
            
            await _db.Proofs.AddAsync(proof);
            await _db.SaveChangesAsync();
*/
            return new ProofResponse
            {
                Value = ""
            };
        }

        private string Encrypt(string plaintext, string publicKey)
        {
            throw new NotImplementedException();
        }

        private static string GenerateRandomString(int len)
        {
            using var rng = new RNGCryptoServiceProvider();
            
            var data = new byte[len];
            rng.GetBytes(data);

            return Convert.ToBase64String(data);
        }
    }
}