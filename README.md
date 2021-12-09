### Nk

`Nk` is an aptly named "no knowledge" key/value storage server. That is, `nk` stores blobs of data (values) by name (key). However, unlike Firebase, Parse, or other oft-used APIs for data storage, `nk` cannot read the data it stores. Furthermore, rather than tying auth to email or social network accounts, `nk` allows anyone to create an account using only an RSA public key. While RSA public keys [should be considered personal data under the GDPR](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3080322), properly isolated keypairs significantly reduce the amount of divulged [PII](https://en.wikipedia.org/wiki/Personal_data), and extricate auth from the various data collection mechanisms of typical auth providers.

Once an account has been created, clients encrypt data before sending to `nk` for storage. The `nk` server *does not enforce that payloads are encrypted*, but only because this is not logically possible in general. Client libraries, like the included `nk-js` library, are responsible for enforcing encrypted payloads.

Clients then use signatures to prove ownership and storage rights. For data retrieval, a signed proof is required to ensure that the request has originated from the owner of the private key.

There is no form of key exchange with `nk`, though running `nk` behind strong TLS (HTTPS) encryption, which does use key exchange mechanisms, is recommended.

`Nk` does not meet the technical requirements of a zero-knowledge system (eg- see [zCash's zk-SNARK](https://z.cash/technology/zksnarks/)), therefore the semi-ambiguous term "no knowlege" is used throughout.

##### Quick Start

Prerequisites:

- `docker`
- `make`

```
make restore
make run
```

Go to `http://localhost:3600`.

That's it! No node, no .NET, no db. This will spin up postgres, adminer, nk-server, and nk-web. Both the server and web projects will rebuild automatically with changes.

##### Why?

This project exists for a few reasons.

Many online services we use every day turn our data into commodities to be bought and sold, or illegally given to government agencies without consent.

Google has read every Gmail message you've ever sent and every Google Doc you've ever created. Dropbox, another often used "free tier" service, may do the same, essentially [without restriction](https://help.dropbox.com/accounts-billing/security/privacy-policy-faq).

> Dropbox processes your data (1) to provide the Dropbox Services to you pursuant to our contract with you; (2) in furtherance of its legitimate interests in operating our Services and business; and (3) with your consent.

Facebook doesn't even try: they transparently follow the money. What data they don't sell, they leak so severely that they have, on certain unnamed occassions, been largely responsible for putting into power various unnamed extremist hate groups and heads of state (enough said on this subject...).

There are countless examples of greed that require no further exposition here.

Online services that do not *intentionally* steal your data often suffer from breaches or fall into the trap of collecting (and potentiality selling) so-called "anonymized" data, from which personally identifiable information has been theoretically removed. Unfortunately, this type of data does not actually exist in the real world. In one [study](https://www.nature.com/articles/s41467-019-10933-3/), researchers showed that "99.98% of Americans would be correctly re-identified" from many of these "anonymized" data sets.

Finally, after the failure of private enterprise to protect our data (through greed, negligence, or ignorance), the Snowden Papers show us how far our own governments have gone in violating our online privacy by compromising the very backbone of the Internet.

Data is not safe in the hands of private enterprise or the state. The best defense, and the necessary future of the Internet, must rely on individuals bearing the modern arms of cryptography.

##### Worst case scenario

`Nk` is not called `zk` because, while neither `nk` nor an attacker may be able to read your data, there are some forms of side channel information that a compromised `nk` will divulge. If an attacker gained access to `nk`s database, they could learn:

1. Within some epsilon, the amount of data stored for each key name. This is dependent on block size of the encryption algorithm.
2. How many values are stored for a specific userId.
3. The public key of a client. By definition, a public key may safely be considered public to begin with-- however, as stated before, public keys are PII. `nk` provides a simple mechanism for deleting public keys and all associated data for GDPR compliance.
4. Strong, cryptographically random [IVs](https://en.wikipedia.org/wiki/Initialization_vector) for each stored value. IVs are considered safe to broadcast in plaintext and do not divulge information about the data being stored nor the client that created them.

Here is what a compromised `nk` database **will not** divulge:

1. Plaintext values. Since all data is stored only in encrypted form and `nk` does not store any form of decryption key, no plaintext data will be divulged.
2. `Nk` does not store timestamps.

##### Nk is safe even if your network is not

While any production server should use SSL, which encrypts network traffic, it is theoretically possible for an agent to sit between a client and server and inspect all traffic between the two. This may be the case on private intranets and has been the case in the past from various state sponsored actors.

`Nk` is resistant to a compromised network because clients never let unencrypted data hit the network.

In a man-in-the-middle scenario, an attacker may, at best, come into possession of a user's public key, encrypted data, or authentication proofs. This means that compromised networks cannot compromise the data sent to `nk`. Additionally, proofs are tied to payload (via signature), so an attacker cannot even use this information to spoof a user and overwrite their data.

##### Nk has more work to do

- Data objects do not need to have userId property. Instead, clients should keep their own manifests, or store the manifest in an encrypted key. This way there is no way to link any data to any user.
- Since RSA PKCS #1 v1.5 is known to be vulnerable to [chosen plaintext attack](https://www.iacr.org/archive/eurocrypt2000/1807/18070091-new.pdf), the proof system needs another round of work, as an actor posing as the server may ask for signatures on targeted plaintext. The short-term plan is for `nk-js` to be migrated to [RSA-OAEP](https://eprint.iacr.org/2011/559.pdf), which is resistant against CPA. Additionally, the proof system may include a certain percentage of the payload from the client appended.
