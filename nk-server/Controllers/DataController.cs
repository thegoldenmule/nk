using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
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
        private readonly ILogger<DataController> _logger;

        public DataController(ILogger<DataController> logger)
        {
            _logger = logger;
        }

        private static string BytesToString(ref byte[] bytes)
        {
            return BitConverter.ToString(bytes);
        }

        private static byte[] StringToBytes(string str)
        {
            var spl = str.Split('-');
            return spl.Select(s => Convert.ToByte(s, 16)).ToArray();
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

            // context
            await using var db = new zkContext();
            
            // find user
            User user;
            try
            {
                user = await db.Users.SingleAsync(u => u.Id == userId);
            }
            catch (Exception exception)
            {
                throw new Exception("User not found.", exception);
            }

            // look up proof (this also validates that the userId matches)
            var persistentProof = await db.Proofs.SingleAsync(p => p.UserId == userId && p.PPlaintext == proof);
            if (persistentProof == null)
            {
                throw new Exception("Invalid proof.");
            }

            // delete proof
            db.Proofs.Remove(persistentProof);
            await db.SaveChangesAsync();

            // verify signature
            if (!EncryptionUtility.IsValidSig(
                proof.ToCharArray().Select(c => (byte) c).ToArray(),
                Convert.FromBase64String(sig),
                user.PublicKeyChars))
            {
                throw new Exception("Invalid signature.");
            }
        }

        private static async Task<byte[]> GetBytes(IFormFile file)
        {
            await using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            return stream.ToArray();
        }

        private async Task<Tuple<byte[], byte[], byte[]>> ParseBody()
        {
            var iv = Request.Form.Files["Iv"];
            var ivBytes = await GetBytes(iv);
            
            var sig = Request.Form.Files["Sig"];
            var sigBytes = await GetBytes(sig);
            
            var payload = Request.Form.Files["Payload"];
            var payloadBytes = await GetBytes(payload);

            return Tuple.Create(ivBytes, sigBytes, payloadBytes);
        }
        
        [HttpPost]
        [Route("{userId}")]
        public async Task<CreateDataResponse> Create(string userId)
        {
            _logger.LogInformation("Received request to create data.", new { userId });
            
            // context
            await using var db = new zkContext();
            
            User user;
            try
            {
                user = await db.Users.SingleAsync(u => u.Id == userId);
            }
            catch (Exception exception)
            {
                _logger.LogError($"Could not create data: could not query users: {exception}.", new { userId });
                
                return new CreateDataResponse
                {
                    Success = false
                };
            }
            
            _logger.LogInformation("Received request to create data.", new { userId });
            
            // read request
            var key = Request.Form["Key"];
            var (iv, sig, payload) = await ParseBody();

            if (!EncryptionUtility.IsValidSig(payload, sig, user.PublicKeyChars))
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
            var datum = new Datum
            {
                UserId = userId,
                Key = key,
                Data = BytesToString(ref payload),
                Iv = BytesToString(ref iv),
            };
            
            try
            {
                await db.Data.AddAsync(datum);
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
                await db.SaveChangesAsync();
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
        public async Task<UpdateDataResponse> Update(string userId, string key)
        {
            _logger.LogInformation("Received request to update data.", new { userId });
            
            // context
            await using var db = new zkContext();
            
            User user;
            try
            {
                user = await db.Users.SingleAsync(u => u.Id == userId);
            }
            catch
            {
                _logger.LogInformation("Received request to update data.", new { userId });
                
                return new UpdateDataResponse
                {
                    Success = false
                };
            }
            
            // read request
            var (iv, sig, payload) = await ParseBody();

            if (!EncryptionUtility.IsValidSig(payload, sig, user.PublicKeyChars))
            {
                _logger.LogInformation("Could not update data: invalid signature.", new { userId });
                
                return new UpdateDataResponse
                {
                    Success = false
                };
            }
            
            // we have now verified that the payload has come from the owner of
            // the private key, and they own this data
            
            // update
            var data = await db.Data.SingleAsync(d => d.Key == key);
            data.Data = BytesToString(ref payload);
            data.Iv = BytesToString(ref iv);
            //_db.Update(data);
            
            await db.SaveChangesAsync();
            
            _logger.LogInformation("Updated data successfully", new { userId });

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
            await using var db = new zkContext();
            var data = await db.Data.Where(d => d.UserId == userId).ToListAsync();

            return new GetKeysResponse
            {
                Success = true,
                Keys = data.Select(d => d.Key).ToArray()
            };
        }

        [HttpGet]
        [Route("{userId}/{key}")]
        public async Task Get(string userId, string key)
        {
            try
            {
                await CheckSignature(userId);
            }
            catch
            {
                Response.StatusCode = 401;
                return;
            }

            // now look up the data
            await using var db = new zkContext();
            var data = await db.Data.SingleAsync(d => d.UserId == userId && d.Key == key);

            await Response.Body.WriteAsync(StringToBytes(data.Iv));
            await Response.Body.WriteAsync(StringToBytes(data.Data));
        }

        [HttpDelete]
        [Route("{userId}/{key}")]
        public async Task<DeleteDataResponse> Delete(string userId, string key)
        {
            _logger.LogInformation("Delete data requested.", new { userId });
            
            try
            {
                await CheckSignature(userId);
            }
            catch
            {
                _logger.LogInformation("Could not delete key: invalid signature.", new { userId });

                return new DeleteDataResponse
                {
                    Success = false,
                };
            }

            await using var db = new zkContext();

            var datum = await db.Data.FirstOrDefaultAsync(d => d.Key == key && d.UserId == userId);
            if (datum == null)
            {
                _logger.LogInformation("Could not delete key: data not found.", new { userId });

                return new DeleteDataResponse
                {
                    Success = false,
                };
            }

            db.Data.Remove(datum);
            await db.SaveChangesAsync();

            _logger.LogInformation("Successfully deleted data.", new { userId });
            
            return new DeleteDataResponse
            {
                Success = true,
            };
        }
    }
}