using System.IO;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TheGoldenMule.Nk.Models.Db;
using TheGoldenMule.Nk.Models.Network;
using TheGoldenMule.Nk.Services;

namespace TheGoldenMule.Nk.Controllers
{
    /// <summary>
    /// Provides endpoints for user access.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        /// <summary>
        /// Logger implementation.
        /// </summary>
        private readonly ILogger<UserController> _logger;

        /// <summary>
        /// Constructor.
        /// </summary>
        public UserController(ILogger<UserController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Endpoint for creating a user from a public key.
        /// </summary>
        [HttpPost]
        public async Task<CreateUserResponse> Create()
        {
            _logger.LogInformation("Received a request to create user.");

            using var reader = new StreamReader(Request.Body);
            var pk = await reader.ReadToEndAsync();
            if (!EncryptionUtility.IsValidPublicKey(pk.ToCharArray()))
            {
                _logger.LogInformation("Could not create user: invalid public key.");
                    
                return new CreateUserResponse
                {
                    Success = false,
                };
            }
                
            var id = GenerateUserId();

            await using var db = new NkContext();
            await db.Users.AddAsync(new User
            {
                Id = id,
                Pk = pk
            });
                
            await db.SaveChangesAsync();
                
            _logger.LogInformation("Created user successfully.", new { userId = id });
                
            return new CreateUserResponse
            {
                Success = true,
                UserId = id
            };
        }
        
        /// <summary>
        /// Generates a unique id for a user.
        /// </summary>
        private static string GenerateUserId()
        {
            using var rng = new RNGCryptoServiceProvider();
            
            var data = new byte[32];
            rng.GetBytes(data);

            return Microsoft.AspNetCore.WebUtilities.WebEncoders.Base64UrlEncode(data);
        }
    }
}