using System;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Zk.Models;
using Zk.Models.Db;

namespace Zk.Controllers
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
                user = await _db.Users.FindAsync(userId);
            }
            catch
            {
                return new CreateDataResponse
                {
                    Success = false
                };
            }

            if (user == null)
            {
                return new CreateDataResponse
                {
                    Success = false
                };
            }
            
            var payloadBytes = Convert.FromBase64String(req.Payload);
            var sigBytes = Convert.FromBase64String(req.Sig);
            
            var rsa = RSA.Create();
            var pk = Convert.FromBase64String(user.Pk);
            rsa.ImportRSAPublicKey(new ReadOnlySpan<byte>(pk), out _);
            
            // hash
            var sha = SHA512.Create();
            var hash = sha.ComputeHash(payloadBytes);
            var verifier = new RSAPKCS1SignatureDeformatter(rsa);
            verifier.SetHashAlgorithm("SHA512");

            if (!verifier.VerifySignature(hash, sigBytes))
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
            throw new NotImplementedException();
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

            if (!Request.Headers.TryGetValue("X-Zk-Sig", out var sigs) || sigs.Count != 1)
            {
                return new GetDataResponse
                {
                    Success = false
                };
            }

            var sig = sigs[0];

            throw new NotImplementedException();
        }
    }
}