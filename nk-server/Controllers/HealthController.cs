using Microsoft.AspNetCore.Mvc;
using TheGoldenMule.Nk.Models.Network;

namespace TheGoldenMule.Nk.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
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