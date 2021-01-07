using System.IO;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using zk_server.Models.Db;
using Zk.Models;

namespace Zk.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly zkContext _db = new zkContext();
        private readonly ILogger<UserController> _logger;

        public UserController(ILogger<UserController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public async Task<CreateUserResponse> Create()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                var pk = await reader.ReadToEndAsync();
                
                // TODO: validate pk
                
                var id = GenerateUserId();

                await _db.Users.AddAsync(new User
                {
                    Id = id,
                    Pk = pk
                });
                
                await _db.SaveChangesAsync();
                
                return new CreateUserResponse
                {
                    UserId = id
                };
            }
        }
        
        private static string GenerateUserId()
        {
            using var rng = new RNGCryptoServiceProvider();
            
            var data = new byte[32];
            rng.GetBytes(data);

            return Microsoft.AspNetCore.WebUtilities.WebEncoders.Base64UrlEncode(data);
        }
    }
}