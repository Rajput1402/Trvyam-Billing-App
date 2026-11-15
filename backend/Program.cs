using System.ComponentModel.DataAnnotations.Schema;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var b = WebApplication.CreateBuilder(args);
var cfg = b.Configuration;
b.Services.AddDbContext<Db>(o => o.UseNpgsql(cfg.GetConnectionString("Db")));
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
b.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new() { IssuerSigningKey = key, ValidateIssuer = false, ValidateAudience = false });
b.Services.AddAuthorization(o => o.AddPolicy("Admin", p => p.RequireClaim("admin", "true")));
var app = b.Build();

// Create tables and the first admin on startup
using (var s = app.Services.CreateScope())
{
    var db = s.ServiceProvider.GetRequiredService<Db>();
    db.Database.EnsureCreated();
    if (!db.Users.Any(u => u.IsAdmin))
    {
        db.Users.Add(new User { Name = "Admin", Username = cfg["Admin:Username"]!.ToLower(), IsAdmin = true,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(cfg["Admin:Password"]!) });
        db.SaveChanges();
    }
}
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

int Uid(ClaimsPrincipal p) => int.Parse(p.FindFirst("uid")!.Value);
bool IsAdmin(ClaimsPrincipal p) => p.FindFirst("admin")?.Value == "true";
// Admin can open every business; a member only the ones they belong to. Deactivated users are always refused.
async Task<bool> Can(Db db, ClaimsPrincipal p, int bid)
{
    var uid = Uid(p);
    if (!await db.Users.AnyAsync(u => u.Id == uid && u.IsActive)) return false;
    return IsAdmin(p) || await db.Members.AnyAsync(m => m.BusinessId == bid && m.UserId == uid);
}
string Token(User u) => new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
    claims: new[] { new Claim("uid", u.Id.ToString()), new Claim("admin", u.IsAdmin ? "true" : "false") },
    expires: DateTime.UtcNow.AddDays(7),
    signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)));

app.MapPost("/api/login", async (Db db, LoginReq r) =>
{
    var un = r.Username.Trim().ToLower();
    var u = await db.Users.FirstOrDefaultAsync(x => x.Username == un && x.IsActive);
    if (u == null || !BCrypt.Net.BCrypt.Verify(r.Password, u.PasswordHash)) return Results.Unauthorized();
    return Results.Ok(new { token = Token(u), name = u.Name, isAdmin = u.IsAdmin });
});

var api = app.MapGroup("/api").RequireAuthorization();
var admin = app.MapGroup("/api").RequireAuthorization("Admin");

// ---- Businesses ----
api.MapGet("/businesses", async (Db db, ClaimsPrincipal p) =>
{
    var uid = Uid(p);
    var q = db.Businesses.AsQueryable();
    if (!IsAdmin(p)) q = q.Where(x => x.Members.Any(m => m.UserId == uid));
    return await q.OrderBy(x => x.Name)
        .Select(x => new { x.Id, x.Name, x.Details, MemberIds = x.Members.Select(m => m.UserId) }).ToListAsync();
});
admin.MapPost("/businesses", async (Db db, BizReq r) =>
{
    if (string.IsNullOrWhiteSpace(r.Name)) return Results.BadRequest("Name is required");
    var biz = new Business { Name = r.Name.Trim(), Details = r.Details ?? "" };
    // The default accounts are added to every new business
    foreach (var id in await db.Users.Where(u => u.IsDefault && u.IsActive).Select(u => u.Id).ToListAsync())
        biz.Members.Add(new Member { UserId = id });
    db.Businesses.Add(biz);
    await db.SaveChangesAsync();
    return Results.Ok(biz.Id);
});
admin.MapPut("/businesses/{id}/members", async (int id, int[] ids, Db db) =>
{
    var have = await db.Members.Where(m => m.BusinessId == id).ToListAsync();
    db.Members.RemoveRange(have.Where(m => !ids.Contains(m.UserId)));
    foreach (var uid in ids.Distinct().Where(i => have.All(m => m.UserId != i)))
        db.Members.Add(new Member { BusinessId = id, UserId = uid });
    await db.SaveChangesAsync();
    return Results.Ok();
});

// ---- Users (admin only) ----
admin.MapGet("/users", (Db db) => db.Users.OrderBy(u => u.Name)
    .Select(u => new { u.Id, u.Name, u.Username, u.IsAdmin, u.IsActive, u.IsDefault }).ToListAsync());
admin.MapPost("/users", async (Db db, UserReq r) =>
{
    var un = r.Username.Trim().ToLower();
    if (un.Length < 3 || r.Password.Length < 6) return Results.BadRequest("Username needs 3+ characters and password 6+");
    if (await db.Users.AnyAsync(u => u.Username == un)) return Results.BadRequest("Username already taken");
    var u = new User { Name = r.Name.Trim(), Username = un, IsDefault = r.IsDefault, PasswordHash = BCrypt.Net.BCrypt.HashPassword(r.Password) };
    db.Users.Add(u);
    await db.SaveChangesAsync();
    if (u.IsDefault) // a new default account joins all existing businesses
    {
        foreach (var bid in await db.Businesses.Select(x => x.Id).ToListAsync()) db.Members.Add(new Member { BusinessId = bid, UserId = u.Id });
        await db.SaveChangesAsync();
    }
    return Results.Ok(u.Id);
});
admin.MapPut("/users/{id}", async (int id, Db db, UserUpd r) =>
{
    var u = await db.Users.FindAsync(id);
    if (u == null) return Results.NotFound();
    if (!string.IsNullOrWhiteSpace(r.Name)) u.Name = r.Name.Trim();
    if (!string.IsNullOrEmpty(r.Password))
    {
        if (r.Password.Length < 6) return Results.BadRequest("Password needs 6+ characters");
        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(r.Password);
    }
    if (!u.IsAdmin) u.IsActive = r.IsActive;
    await db.SaveChangesAsync();
    return Results.Ok();
});

// ---- Expenses (items bought) and sales (products sold) ----
api.MapGet("/businesses/{id}/summary", async (int id, Db db, ClaimsPrincipal p) =>
{
    if (!await Can(db, p, id)) return Results.Forbid();
    var s = await db.Sales.Where(x => x.BusinessId == id).SumAsync(x => (decimal?)x.Amount) ?? 0;
    var e = await db.Expenses.Where(x => x.BusinessId == id).SumAsync(x => (decimal?)x.Amount) ?? 0;
    return Results.Ok(new { sales = s, expenses = e, profit = s - e });
});
api.MapGet("/businesses/{id}/expenses", async (int id, Db db, ClaimsPrincipal p) =>
    !await Can(db, p, id) ? Results.Forbid() : Results.Ok(await db.Expenses.Where(x => x.BusinessId == id)
        .OrderByDescending(x => x.Date).ThenByDescending(x => x.Id).Take(200)
        .Select(x => new { x.Id, Name = x.ItemName, x.Amount, Qty = 1, x.Date, x.Notes, AddedBy = x.AddedBy.Name }).ToListAsync()));
api.MapPost("/businesses/{id}/expenses", async (int id, Db db, ClaimsPrincipal p, EntryReq r) =>
{
    if (!await Can(db, p, id)) return Results.Forbid();
    if (string.IsNullOrWhiteSpace(r.Name) || r.Amount <= 0) return Results.BadRequest("Enter an item and an amount above 0");
    db.Expenses.Add(new Expense { BusinessId = id, AddedById = Uid(p), ItemName = r.Name.Trim(), Amount = r.Amount,
        Date = r.Date ?? DateOnly.FromDateTime(DateTime.UtcNow), Notes = r.Notes ?? "" });
    await db.SaveChangesAsync();
    return Results.Ok();
});
api.MapGet("/businesses/{id}/sales", async (int id, Db db, ClaimsPrincipal p) =>
    !await Can(db, p, id) ? Results.Forbid() : Results.Ok(await db.Sales.Where(x => x.BusinessId == id)
        .OrderByDescending(x => x.Date).ThenByDescending(x => x.Id).Take(200)
        .Select(x => new { x.Id, Name = x.ProductName, x.Amount, x.Qty, x.Date, x.Notes, AddedBy = x.AddedBy.Name }).ToListAsync()));
api.MapPost("/businesses/{id}/sales", async (int id, Db db, ClaimsPrincipal p, EntryReq r) =>
{
    if (!await Can(db, p, id)) return Results.Forbid();
    if (string.IsNullOrWhiteSpace(r.Name) || r.Amount <= 0) return Results.BadRequest("Enter a product and an amount above 0");
    db.Sales.Add(new Sale { BusinessId = id, AddedById = Uid(p), ProductName = r.Name.Trim(), Qty = Math.Max(1, r.Qty), Amount = r.Amount,
        Date = r.Date ?? DateOnly.FromDateTime(DateTime.UtcNow), Notes = r.Notes ?? "" });
    await db.SaveChangesAsync();
    return Results.Ok();
});
// Only the admin can delete entries
admin.MapDelete("/expenses/{id}", async (int id, Db db) => { await db.Expenses.Where(x => x.Id == id).ExecuteDeleteAsync(); return Results.Ok(); });
admin.MapDelete("/sales/{id}", async (int id, Db db) => { await db.Sales.Where(x => x.Id == id).ExecuteDeleteAsync(); return Results.Ok(); });

app.Run();

record LoginReq(string Username, string Password);
record BizReq(string Name, string? Details);
record UserReq(string Name, string Username, string Password, bool IsDefault);
record UserUpd(string? Name, string? Password, bool IsActive);
record EntryReq(string Name, decimal Amount, int Qty, DateOnly? Date, string? Notes);

class User { public int Id { get; set; } public string Name { get; set; } = ""; public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = ""; public bool IsAdmin { get; set; } public bool IsActive { get; set; } = true; public bool IsDefault { get; set; } }
class Business { public int Id { get; set; } public string Name { get; set; } = ""; public string Details { get; set; } = ""; public List<Member> Members { get; set; } = new(); }
class Member { public int BusinessId { get; set; } public int UserId { get; set; } }
class Expense { public int Id { get; set; } public int BusinessId { get; set; } public int AddedById { get; set; } public User AddedBy { get; set; } = null!;
    public string ItemName { get; set; } = ""; [Column(TypeName = "numeric(18,2)")] public decimal Amount { get; set; }
    public DateOnly Date { get; set; } public string Notes { get; set; } = ""; public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
class Sale { public int Id { get; set; } public int BusinessId { get; set; } public int AddedById { get; set; } public User AddedBy { get; set; } = null!;
    public string ProductName { get; set; } = ""; public int Qty { get; set; } = 1; [Column(TypeName = "numeric(18,2)")] public decimal Amount { get; set; }
    public DateOnly Date { get; set; } public string Notes { get; set; } = ""; public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }

class Db(DbContextOptions<Db> o) : DbContext(o)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Sale> Sales => Set<Sale>();
    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<Member>().HasKey(x => new { x.BusinessId, x.UserId });
        m.Entity<User>().HasIndex(x => x.Username).IsUnique();
    }
}
