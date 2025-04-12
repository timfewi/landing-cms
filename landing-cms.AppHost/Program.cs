
var builder = DistributedApplication.CreateBuilder(args);

// Redis
var redis = builder.AddRedis("redis").WithRedisCommander();

// Postgres
var postgresServer = builder
    .AddPostgres("postgres")
    .WithPgAdmin()
    .WithLifetime(ContainerLifetime.Persistent);

// Server DB
var db = postgresServer.AddDatabase("db");

// Backend API
var server = builder.AddProject<Projects.landing_cms_Server>("server")
    .WithReference(redis)
    .WithExternalHttpEndpoints();


// Angular Frontend
if (builder.ExecutionContext.IsPublishMode)
{
    builder
    .AddDockerfile("frontend", "../landing-cms.Client")
    .WithHttpEndpoint(port: 4200, env: "PORT")
    .WithExternalHttpEndpoints();

}
else
{
    var frontend = builder
     .AddNpmApp("frontend", "../landing-cms.Client")
     .WithNpmPackageInstallation()
     .WithOtlpExporter()
     .AsHttp2Service()
     .WithEnvironment("OTEL_LOG_LEVEL", "debug")
     .WithReference(server)
     .WaitFor(server)
     .WithReference(redis)
     .WaitFor(redis)
     .WithOtlpExporter()
     .WithHttpEndpoint(env: "PORT", port: 4200)
     .WithExternalHttpEndpoints()
     //.WithEnvironment("NODE_TLS_REJECT_UNAUTHORIZED", "0")
     //.WithEnvironment("SERVER_URL", server.GetEndpoint("https"))
     .PublishAsDockerFile();
}

builder.Build().Run();
