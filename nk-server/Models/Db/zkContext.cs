using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

#nullable disable

namespace TheGoldenMule.Nk.Models.Db
{
    public partial class zkContext : DbContext
    {
        public zkContext()
        {
        }

        public zkContext(DbContextOptions<zkContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Datum> Data { get; set; }
        public virtual DbSet<Proof> Proofs { get; set; }
        public virtual DbSet<User> Users { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseNpgsql("Server=db;Database=nk;Username=postgres;Password=example");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("Relational:Collation", "en_US.utf16");

            modelBuilder.Entity<Datum>(entity =>
            {
                entity.ToTable("data");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Data)
                    .IsRequired()
                    .HasColumnName("data");

                entity.Property(e => e.Key)
                    .IsRequired()
                    .HasColumnName("key");

                entity.Property(e => e.UserId)
                    .IsRequired()
                    .HasColumnName("userId");

                entity.Property(e => e.Iv)
                    .IsRequired()
                    .HasColumnName("iv");
            });

            modelBuilder.Entity<Proof>(entity =>
            {
                entity.ToTable("proof");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("nextval('salts_id_seq'::regclass)");

                entity.Property(e => e.PPlaintext)
                    .IsRequired()
                    .HasColumnName("p_plaintext");

                entity.Property(e => e.UserId)
                    .IsRequired()
                    .HasColumnName("userId");
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("user");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Pk)
                    .IsRequired()
                    .HasColumnName("pk");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
