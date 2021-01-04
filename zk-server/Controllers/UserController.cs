using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using zk_server.Models;
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
        public async Task<UserCreationRecord> Create()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                var pk = await reader.ReadToEndAsync();
                var id = Guid.NewGuid().ToString();

                await _db.Users.AddAsync(new User
                {
                    Id = id,
                    Pk = pk
                });
                
                await _db.SaveChangesAsync();
                
                return new UserCreationRecord
                {
                    UserId = id
                };
            }
        }
    }
}