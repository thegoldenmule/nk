using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TheGoldenMule.Nk.Models.Db;
using TheGoldenMule.Nk.Models.Network;
using TheGoldenMule.Nk.Services;

namespace TheGoldenMule.Nk.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DataController : ControllerBase
    {
        private readonly zkContext _db = new zkContext();
        private readonly ILogger<DataController> _logger;

        public DataController(ILogger<DataController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        [Route("{userId}")]
        public async Task<CreateDataResponse> Create(string userId, CreateDataRequest req)
        {
            User user;
            try
            {
                user = await _db.Users.SingleAsync(u => u.Id == userId);
            }
            catch
            {
                return new CreateDataResponse
                {
                    Success = false
                };
            }

            var payloadBytes = Convert.FromBase64String(req.Payload);
            var sigBytes = Convert.FromBase64String(req.Sig);

            if (!EncryptionUtility.IsValidSig(payloadBytes, sigBytes, user.PublicKeyBytes))
            {
                return new CreateDataResponse
                {
                    Success = false
                };
            }
            
            // we have now verified that the payload has come from the owner of
            // the private key
            
            // store payload
            await _db.Data.AddAsync(new Datum
            {
                UserId = userId,
                Key = req.Key,
                Data = req.Payload
            });
            await _db.SaveChangesAsync();

            return new CreateDataResponse
            {
                Success = true
            };
        }

        [HttpPut]
        [Route("{userId}/{key}")]
        public async Task<UpdateDataResponse> Update(string userId, string key, UpdateDataRequest req)
        {
            User user;
            try
            {
                user = await _db.Users.SingleAsync(u => u.Id == userId);
            }
            catch
            {
                return new UpdateDataResponse
                {
                    Success = false
                };
            }

            var payloadBytes = Convert.FromBase64String(req.Payload);
            var sigBytes = Convert.FromBase64String(req.Sig);

            if (!EncryptionUtility.IsValidSig(payloadBytes, sigBytes, user.PublicKeyBytes))
            {
                return new UpdateDataResponse
                {
                    Success = false
                };
            }
            
            // we have now verified that the payload has come from the owner of
            // the private key, and they own this data
            
            // update
            var data = await _db.Data.SingleAsync(d => d.Key == key);
            data.Data = req.Payload;
            _db.Update(data);
            
            await _db.SaveChangesAsync();

            return new UpdateDataResponse
            {
                Success = true
            };
        }

        [HttpGet]
        [Route("{userId}/{key}")]
        public async Task<GetDataResponse> Get(string userId, string key)
        {
            // read proof from header
            if (!Request.Headers.TryGetValue("X-Zk-Proof", out var proofs) || proofs.Count != 1)
            {
                return new GetDataResponse
                {
                    Success = false
                };
            }
            var proof = proofs[0];
            
            // look up proof (this also validates that the userId matches)
            var persistentProof = await _db.Proofs.SingleAsync(p => p.UserId == userId && p.PPlaintext == proof);
            if (persistentProof == null)
            {
                return new GetDataResponse
                {
                    Success = false
                };
            }
            
            // TODO: verify signature

            // delete proof
            _db.Proofs.Remove(persistentProof);
            await _db.SaveChangesAsync();
            
            // now look up the data
            var data = _db.Data.Single(d => d.UserId == userId && d.Key == key);

            return new GetDataResponse
            {
                Success = true,
                Value = data.Data
            };
        }
    }
}