var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();

// Registriere Repository und Service
builder.Services.AddSingleton<landing_cms.Server.Repositories.IPageRepository, landing_cms.Server.Repositories.InMemoryPageRepository>();
builder.Services.AddScoped<landing_cms.Server.Services.IPageService, landing_cms.Server.Services.PageService>();

builder.Services.AddProblemDetails();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Konfiguriere JSON-Serialisierung für zirkuläre Referenzen
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
});

var app = builder.Build();

app.UseCors(options =>
{
    options.AllowAnyOrigin();
    options.AllowAnyMethod();
    options.AllowAnyHeader();
});

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
