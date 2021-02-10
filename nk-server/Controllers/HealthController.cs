using Microsoft.AspNetCore.Mvc;
using TheGoldenMule.Nk.Models.Network;

namespace TheGoldenMule.Nk.Controllers
{
    /// <summary>
    /// Provides a simple health check.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        /// <summary>
        /// Returns a simple response.
        /// </summary>
        [HttpGet]
        public GetHealthResponse Get()
        {
            return new GetHealthResponse
            {
                Success = true
            };
        }
    }
}