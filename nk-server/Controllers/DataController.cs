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
        
        private async Task CheckSignature(string userId)
        {
            // read proof and signature from header
            if (!Request.Headers.TryGetValue("X-Nk-Proof", out var proofs) || proofs.Count != 1
                || !Request.Headers.TryGetValue("X-Nk-Proof-Sig", out var signatures) || signatures.Count != 1)
            {
                throw new Exception("Invalid headers.");
            }

            var proof = proofs[0];
            var sig = signatures[0];

            // find user
            User user;
            try
            {
                user = await _db.Users.SingleAsync(u => u.Id == userId);
            }
            catch (Exception exception)
            {
                throw new Exception("User not found.", exception);
            }

            // look up proof (this also validates that the userId matches)
            var persistentProof = await _db.Proofs.SingleAsync(p => p.UserId == userId && p.PPlaintext == proof);
            if (persistentProof == null)
            {
                throw new Exception("Invalid proof.");
            }

            // delete proof
            _db.Proofs.Remove(persistentProof);
            await _db.SaveChangesAsync();

            // verify signature
            if (!EncryptionUtility.IsValidSig(
                proof.ToCharArray().Select(c => (byte) c).ToArray(),
                Convert.FromBase64String(sig),
                user.PublicKeyChars))
            {
                throw new Exception("Invalid signature.");
            }
        }

        [HttpPost]
        [Route("{userId}")]
        public async Task<CreateDataResponse> Create(string userId, CreateDataRequest req)
        {
            _logger.LogInformation("Received request to create data.", new { userId });
            
            User user;
            try
            {
                user = await _db.Users.SingleAsync(u => u.Id == userId);
            }
            catch (Exception exception)
            {
                _logger.LogError($"Could not create data: could not query users: {exception}.", new { userId });
                
                return new CreateDataResponse
                {
                    Success = false
                };
            }

            var payloadBytes = Convert.FromBase64String(req.Payload);
            var sigBytes = Convert.FromBase64String(req.Sig);

            if (!EncryptionUtility.IsValidSig(payloadBytes, sigBytes, user.PublicKeyChars))
            {
                _logger.LogInformation($"Could not create data: invalid signature.", new { userId });
                
                return new CreateDataResponse
                {
                    Success = false
                };
            }
            
            // we have now verified that the payload has come from the owner of
            // the private key
            
            // store payload
            try
            {
                await _db.Data.AddAsync(new Datum
                {
                    UserId = userId,
                    Key = req.Key,
                    Data = req.Payload
                });
            }
            catch (Exception exception)
            {
                _logger.LogError($"Could not create data: could not add data to store: {exception}.", new { userId });
                
                return new CreateDataResponse
                {
                    Success = false
                };
            }

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (Exception exception)
            {
                _logger.LogError($"Could not create data: could not save data to store: {exception}.", new { userId });
                
                return new CreateDataResponse
                {
                    Success = false
                };
            }
            
            _logger.LogInformation("Successfully created new data object.", new { userId });

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

            if (!EncryptionUtility.IsValidSig(payloadBytes, sigBytes, user.PublicKeyChars))
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
        [Route("{userId}")]
        public async Task<GetKeysResponse> GetKeys(string userId)
        {
            _logger.LogInformation("Attempting to get keys.", new { userId });

            try
            {
                await CheckSignature(userId);
            }
            catch (Exception exception)
            {
                _logger.LogInformation($"Could not get keys: {exception}.");
                
                return new GetKeysResponse
                {
                    Success = false
                };
            }

            // read all keys
            var data = await _db.Data.Where(d => d.UserId == userId).ToListAsync();

            return new GetKeysResponse
            {
                Success = true,
                Keys = data.Select(d => d.Key).ToArray()
            };
        }

        [HttpGet]
        [Route("{userId}/{key}")]
        public async Task<GetDataResponse> Get(string userId, string key)
        {
            // TODO: verify proof

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