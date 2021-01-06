﻿using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

#nullable disable

namespace Zk.Models.Db
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
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseNpgsql("Host=localhost;Database=zk;Username=postgres;Password=example");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("Relational:Collation", "en_US.utf8");

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
